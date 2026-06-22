import { BadRequestException } from '@nestjs/common';
import { assertAllowedStorageUrl } from './validate-storage-url.util';

describe('assertAllowedStorageUrl', () => {
  it('accepts relative storage paths', () => {
    expect(() => assertAllowedStorageUrl('/uploads/tenant-1/file.pdf')).not.toThrow();
  });

  it('rejects external URLs', () => {
    expect(() => assertAllowedStorageUrl('https://evil.example/file.pdf')).toThrow(
      BadRequestException,
    );
  });

  it('rejects arbitrary relative paths', () => {
    expect(() => assertAllowedStorageUrl('/etc/passwd')).toThrow(BadRequestException);
  });
});
