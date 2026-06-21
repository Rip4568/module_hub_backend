import { IsObject, IsOptional } from 'class-validator';

export class UpdateTenantConfigDto {
  @IsOptional()
  @IsObject()
  config?: Record<string, unknown>;

  @IsOptional()
  @IsObject()
  branding?: Record<string, unknown>;
}
