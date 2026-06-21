import { BadRequestException } from '@nestjs/common';
import { memoryStorage } from 'multer';

const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]);

export const DOCUMENT_MAX_FILE_SIZE = 10 * 1024 * 1024;

export const documentUploadOptions = {
  storage: memoryStorage(),
  limits: { fileSize: DOCUMENT_MAX_FILE_SIZE },
  fileFilter: (
    _req: Express.Request,
    file: Express.Multer.File,
    callback: (error: Error | null, acceptFile: boolean) => void,
  ) => {
    if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
      return callback(
        new BadRequestException('Only PDF, JPG, PNG and DOCX files are allowed'),
        false,
      );
    }
    callback(null, true);
  },
};
