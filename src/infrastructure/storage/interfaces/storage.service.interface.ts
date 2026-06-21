export interface StorageUploadResult {
  key: string;
  url: string;
  size: number;
  mimeType?: string;
}

export interface IStorageService {
  upload(
    tenantId: string,
    filename: string,
    buffer: Buffer,
    mimeType?: string,
  ): Promise<StorageUploadResult>;

  delete(tenantId: string, key: string): Promise<void>;

  getUrl(tenantId: string, key: string): string;
}

export const STORAGE_SERVICE = Symbol('STORAGE_SERVICE');
