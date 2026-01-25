import { IsString, IsNumber, IsOptional, IsArray, ValidateNested, IsEmail, IsObject, IsNotEmpty, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';
import { Address } from '../../../common/interfaces/address.interface';

class OrderItemDto {
    @IsUUID()
    @IsNotEmpty()
    productId: string;

    @IsUUID()
    @IsOptional()
    variantId?: string;

    @IsNumber()
    @IsNotEmpty()
    quantity: number;
}

export class CreateOrderDto {
    @IsString()
    @IsNotEmpty()
    customerName: string;

    @IsEmail()
    @IsOptional()
    customerEmail?: string;

    @IsString()
    @IsOptional()
    customerPhone?: string;

    @IsString()
    @IsOptional()
    customerDocument?: string;

    @IsObject()
    @IsNotEmpty()
    shippingAddress: Address;

    @IsUUID()
    @IsOptional()
    organizationId?: string;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => OrderItemDto)
    items: OrderItemDto[];

    @IsString()
    @IsOptional()
    notes?: string;

    @IsObject()
    @IsOptional()
    metadata?: any;
}

export class UpdateOrderDto {
    @IsString()
    @IsOptional()
    customerName?: string;

    @IsEmail()
    @IsOptional()
    customerEmail?: string;

    @IsString()
    @IsOptional()
    customerPhone?: string;

    @IsObject()
    @IsOptional()
    shippingAddress?: Address;

    @IsString()
    @IsOptional()
    notes?: string;
}
