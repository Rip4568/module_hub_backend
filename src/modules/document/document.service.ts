import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Document } from './entities/document.entity';

@Injectable()
export class DocumentService {
  constructor(
    @InjectRepository(Document)
    private documentRepository: Repository<Document>,
  ) {}

  async create(createDocumentDto: any): Promise<Document> {
    const document = this.documentRepository.create(createDocumentDto as Document);
    return this.documentRepository.save(document);
  }

  async findOne(id: string): Promise<Document> {
    const document = await this.documentRepository.findOne({ where: { id } });
    if (!document) {
      throw new NotFoundException(`Document with ID ${id} not found`);
    }
    return document;
  }

  // Placeholder for S3/MinIO upload logic
  async uploadFile(file: any): Promise<string> {
      // In real app, upload to S3 and return URL
      return `https://s3.amazonaws.com/bucket/${file.originalname}`;
  }
}
