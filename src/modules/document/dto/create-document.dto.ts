import { IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';
import { DocumentStatus } from '../entities/document.entity';

export class CreateDocumentDto {
  @IsOptional()
  @IsUUID()
  organizationId?: string;

  @IsOptional()
  @IsUUID()
  vehicleId?: string;

  @IsOptional()
  @IsUUID()
  driverId?: string;

  @IsString()
  @IsNotEmpty()
  type: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  fileUrl: string;

  @IsOptional()
  fileSize?: number;

  @IsOptional()
  @IsString()
  mimeType?: string;

  @IsOptional()
  @IsEnum(DocumentStatus)
  status?: DocumentStatus;

  @IsOptional()
  expiresAt?: Date;

  @IsOptional()
  metadata?: Record<string, unknown>;
}
