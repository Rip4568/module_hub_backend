import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { extname } from 'path';
import { Repository } from 'typeorm';
import { Document } from './entities/document.entity';
import { CreateDocumentDto } from './dto/create-document.dto';
import { UploadedDocumentFile } from './interfaces/uploaded-file.interface';
import { PaginatedResult } from '../../common/interfaces/paginated-result.interface';
import {
  IStorageService,
  STORAGE_SERVICE,
} from '../../infrastructure/storage/interfaces/storage.service.interface';

@Injectable()
export class DocumentService {
  constructor(
    @InjectRepository(Document)
    private documentRepository: Repository<Document>,
    @Inject(STORAGE_SERVICE)
    private readonly storageService: IStorageService,
  ) {}

  async create(tenantId: string, createDocumentDto: CreateDocumentDto): Promise<Document> {
    const document = this.documentRepository.create({
      ...createDocumentDto,
      tenantId,
    } as Document);
    return this.documentRepository.save(document);
  }

  async findAll(tenantId: string, page = 1, limit = 20): Promise<PaginatedResult<Document>> {
    const [data, total] = await this.documentRepository.findAndCount({
      where: { tenantId },
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
    });
    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(tenantId: string, id: string): Promise<Document> {
    const document = await this.documentRepository.findOne({ where: { id, tenantId } });
    if (!document) {
      throw new NotFoundException(`Document with ID ${id} not found`);
    }
    return document;
  }

  async remove(tenantId: string, id: string): Promise<void> {
    const document = await this.findOne(tenantId, id);
    await this.documentRepository.remove(document);
  }

  async uploadFile(file: UploadedDocumentFile, tenantId?: string): Promise<Document> {
    if (!file?.buffer) {
      throw new BadRequestException('File buffer is required for upload');
    }
    if (!tenantId) {
      throw new BadRequestException('Tenant ID is required for upload');
    }

    const result = await this.storageService.upload(
      tenantId,
      file.originalname,
      file.buffer,
      file.mimetype,
    );

    const extension = extname(file.originalname).replace('.', '').toUpperCase() || 'FILE';

    const document = this.documentRepository.create({
      tenantId,
      type: extension,
      name: file.originalname,
      fileUrl: result.url,
      fileSize: result.size ?? file.size,
      mimeType: file.mimetype,
      metadata: { originalName: file.originalname },
    });

    return this.documentRepository.save(document);
  }
}
