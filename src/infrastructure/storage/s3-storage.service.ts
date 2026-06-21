import { Injectable, Logger, NotImplementedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IStorageService, StorageUploadResult } from './interfaces/storage.service.interface';

/**
 * S3 storage adapter — configure AWS_S3_BUCKET, AWS_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY.
 * Install @aws-sdk/client-s3 when enabling in production.
 */
@Injectable()
export class S3StorageService implements IStorageService {
  private readonly logger = new Logger(S3StorageService.name);
  private readonly bucket: string;
  private readonly region: string;

  constructor(private readonly configService: ConfigService) {
    this.bucket = this.configService.get<string>('AWS_S3_BUCKET', '');
    this.region = this.configService.get<string>('AWS_REGION', 'us-east-1');

    if (!this.bucket) {
      this.logger.warn('AWS_S3_BUCKET is not configured — S3 storage is not operational');
    }
  }

  async upload(
    _tenantId: string,
    _filename: string,
    _buffer: Buffer,
    _mimeType?: string,
  ): Promise<StorageUploadResult> {
    throw new NotImplementedException(
      'S3 storage requires @aws-sdk/client-s3. Set STORAGE_PROVIDER=local for development.',
    );
  }

  async delete(_tenantId: string, _key: string): Promise<void> {
    throw new NotImplementedException('S3 storage is not yet implemented');
  }

  getUrl(tenantId: string, key: string): string {
    return `https://${this.bucket}.s3.${this.region}.amazonaws.com/${tenantId}/${key}`;
  }
}
