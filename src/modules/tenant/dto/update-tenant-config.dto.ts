import { IsObject, IsOptional } from 'class-validator';
import { TenantBranding, TenantConfig } from '../interfaces/tenant-config.interface';

export class UpdateTenantConfigDto {
  @IsOptional()
  @IsObject()
  config?: Partial<TenantConfig>;

  @IsOptional()
  @IsObject()
  branding?: Partial<TenantBranding>;
}
