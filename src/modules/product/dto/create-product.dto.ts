import { IsString, IsNumber, IsOptional, IsArray, IsEnum, IsBoolean } from 'class-validator';
import { ProductStatus } from '../entities/product.entity';

export class CreateProductDto {
    @IsString()
    name: string;

    @IsString()
    @IsOptional()
    description?: string;

    @IsString()
    @IsOptional()
    sku?: string;

    @IsNumber()
    price: number;

    @IsNumber()
    @IsOptional()
    stock?: number;

    @IsBoolean()
    @IsOptional()
    trackInventory?: boolean;

    @IsEnum(ProductStatus)
    @IsOptional()
    status?: ProductStatus;

    @IsArray()
    @IsOptional()
    categories?: string[];

    @IsArray()
    @IsOptional()
    variants?: any[]; // For now, can be detailed later
}

export class UpdateProductDto extends CreateProductDto { }
