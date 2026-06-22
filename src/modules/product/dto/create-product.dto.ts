import {
  IsString,
  IsNumber,
  IsOptional,
  IsArray,
  IsEnum,
  IsBoolean,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { EcommerceStatus } from '../entities/ecommerce-profile.entity';

export class EcommerceProfileDto {
  @IsString()
  @IsOptional()
  slug?: string;

  @IsString()
  @IsOptional()
  publicName?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(EcommerceStatus)
  @IsOptional()
  status?: EcommerceStatus;

  @IsArray()
  @IsOptional()
  images?: string[];
}

export class CreateProductDto {
  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  sku?: string;

  @IsNumber()
  price: number;

  @IsNumber()
  @IsOptional()
  stock?: number;

  @IsNumber()
  @IsOptional()
  cost?: number;

  @IsBoolean()
  @IsOptional()
  trackInventory?: boolean;

  @IsOptional()
  @ValidateNested()
  @Type(() => EcommerceProfileDto)
  ecommerce?: EcommerceProfileDto;

  @IsArray()
  @IsOptional()
  categories?: string[];

  @IsArray()
  @IsOptional()
  variants?: any[];
}

export class UpdateProductDto extends CreateProductDto {}
