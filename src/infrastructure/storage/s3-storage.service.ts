import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DeleteObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { randomUUID } from 'crypto';
import { IStorageService, StorageUploadResult } from './interfaces/storage.service.interface';
import { sanitizeFilename } from './utils/sanitize-filename.util';

@Injectable()
export class S3StorageService implements IStorageService {
  private readonly logger = new Logger(S3StorageService.name);
  private readonly bucket: string;
  private readonly region: string;
  private readonly client: S3Client | null;

  constructor(private readonly configService: ConfigService) {
    this.bucket = this.configService.get<string>('AWS_S3_BUCKET', '');
    this.region = this.configService.get<string>('AWS_REGION', 'us-east-1');

    const accessKeyId = this.configService.get<string>('AWS_ACCESS_KEY_ID', '');
    const secretAccessKey = this.configService.get<string>('AWS_SECRET_ACCESS_KEY', '');

    if (this.bucket && accessKeyId && secretAccessKey) {
      this.client = new S3Client({
        region: this.region,
        credentials: { accessKeyId, secretAccessKey },
      });
    } else {
      this.client = null;
      if (process.env.NODE_ENV !== 'production') {
        this.logger.warn('S3 credentials are not fully configured — S3 storage is not operational');
      }
    }
  }

  private getClient(): S3Client {
    if (!this.client) {
      throw new Error('S3 storage is not configured');
    }
    return this.client;
  }

  private objectKey(tenantId: string, key: string): string {
    const safeTenantId = tenantId.replace(/[^a-zA-Z0-9_-]/g, '_');
    return `${safeTenantId}/${key}`;
  }

  async upload(
    tenantId: string,
    filename: string,
    buffer: Buffer,
    mimeType?: string,
  ): Promise<StorageUploadResult> {
    const safeName = sanitizeFilename(filename);
    const key = `${randomUUID()}-${safeName}`;
    const client = this.getClient();

    await client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: this.objectKey(tenantId, key),
        Body: buffer,
        ContentType: mimeType,
      }),
    );

    this.logger.debug(`File uploaded to S3: ${this.objectKey(tenantId, key)}`);

    return {
      key,
      url: this.getUrl(tenantId, key),
      size: buffer.length,
      mimeType,
    };
  }

  async delete(tenantId: string, key: string): Promise<void> {
    const safeKey = key.split('/').pop() || key;
    const client = this.getClient();

    try {
      await client.send(
        new DeleteObjectCommand({
          Bucket: this.bucket,
          Key: this.objectKey(tenantId, safeKey),
        }),
      );
    } catch (error) {
      this.logger.warn(`Failed to delete S3 object: ${(error as Error).message}`);
    }
  }

  getUrl(tenantId: string, key: string): string {
    const safeTenantId = tenantId.replace(/[^a-zA-Z0-9_-]/g, '_');
    const safeKey = key.split('/').pop() || key;
    return `https://${this.bucket}.s3.${this.region}.amazonaws.com/${safeTenantId}/${safeKey}`;
  }
}
