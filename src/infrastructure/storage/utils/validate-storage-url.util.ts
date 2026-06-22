import { BadRequestException } from '@nestjs/common';

export function assertAllowedStorageUrl(url: string, baseUrl = '/uploads'): void {
  if (!url || typeof url !== 'string') {
    throw new BadRequestException('Document URL is required');
  }

  const normalizedBase = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
  const isRelativeStoragePath = url === normalizedBase || url.startsWith(`${normalizedBase}/`);

  if (isRelativeStoragePath) {
    return;
  }

  if (url.startsWith('http://') || url.startsWith('https://')) {
    throw new BadRequestException('External document URLs are not allowed');
  }

  throw new BadRequestException('Document URL must point to an uploaded file');
}
