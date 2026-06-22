import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs/promises';
import * as path from 'path';
import { randomUUID } from 'crypto';
import { IStorageService, StorageUploadResult } from './interfaces/storage.service.interface';
import { sanitizeFilename } from './utils/sanitize-filename.util';

@Injectable()
export class LocalStorageService implements IStorageService {
  private readonly logger = new Logger(LocalStorageService.name);
  private readonly baseDir: string;
  private readonly baseUrl: string;

  constructor(private readonly configService: ConfigService) {
    this.baseDir = this.configService.get<string>('STORAGE_LOCAL_PATH', 'uploads');
    this.baseUrl = this.configService.get<string>('STORAGE_LOCAL_BASE_URL', '/uploads');
  }

  private resolveTenantDir(tenantId: string): string {
    const safeTenantId = tenantId.replace(/[^a-zA-Z0-9_-]/g, '_');
    return path.join(this.baseDir, safeTenantId);
  }

  async upload(
    tenantId: string,
    filename: string,
    buffer: Buffer,
    mimeType?: string,
  ): Promise<StorageUploadResult> {
    const safeName = sanitizeFilename(filename);
    const key = `${randomUUID()}-${safeName}`;
    const tenantDir = this.resolveTenantDir(tenantId);

    await fs.mkdir(tenantDir, { recursive: true });

    const filePath = path.join(tenantDir, key);
    await fs.writeFile(filePath, buffer);

    this.logger.debug(`File saved locally: ${filePath}`);

    return {
      key,
      url: this.getUrl(tenantId, key),
      size: buffer.length,
      mimeType,
    };
  }

  async delete(tenantId: string, key: string): Promise<void> {
    const safeKey = path.basename(key);
    const filePath = path.join(this.resolveTenantDir(tenantId), safeKey);

    try {
      await fs.unlink(filePath);
    } catch (error) {
      this.logger.warn(`Failed to delete file ${filePath}: ${(error as Error).message}`);
    }
  }

  getUrl(tenantId: string, key: string): string {
    const safeTenantId = tenantId.replace(/[^a-zA-Z0-9_-]/g, '_');
    const safeKey = path.basename(key);
    return `${this.baseUrl}/${safeTenantId}/${safeKey}`;
  }
}
