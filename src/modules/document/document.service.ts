import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Document } from './entities/document.entity';
import { CreateDocumentDto } from './dto/create-document.dto';
import { UploadedDocumentFile } from './interfaces/uploaded-file.interface';

@Injectable()
export class DocumentService {
  constructor(
    @InjectRepository(Document)
    private documentRepository: Repository<Document>,
  ) {}

  async create(tenantId: string, createDocumentDto: CreateDocumentDto): Promise<Document> {
    const document = this.documentRepository.create({
      ...createDocumentDto,
      tenantId,
    } as Document);
    return this.documentRepository.save(document);
  }

  async findAll(tenantId: string): Promise<Document[]> {
    return this.documentRepository.find({
      where: { tenantId },
      order: { createdAt: 'DESC' },
    });
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

  // Placeholder for S3/MinIO upload logic
  async uploadFile(file: UploadedDocumentFile): Promise<string> {
      // In real app, upload to S3 and return URL
      return `https://s3.amazonaws.com/bucket/${file.originalname}`;
  }
}
