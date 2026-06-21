import { IsString, IsObject, IsNotEmpty, IsUUID, IsOptional, IsEnum } from 'class-validator';
import { Address } from '../../../common/interfaces/address.interface';
import { DeliveryType } from '../entities/delivery.entity';

export class CreateDeliveryDto {
    @IsUUID()
    @IsOptional()
    orderId?: string;

    @IsUUID()
    @IsOptional()
    driverId?: string;

    @IsUUID()
    @IsOptional()
    vehicleId?: string;

    @IsEnum(DeliveryType)
    @IsOptional()
    type?: DeliveryType;

    @IsString()
    @IsOptional()
    description?: string;

    @IsObject()
    @IsOptional()
    originAddress?: Address;

    @IsObject()
    @IsNotEmpty()
    destinationAddress: Address;
}

export class CreateIndependentDeliveryDto {
    @IsUUID()
    @IsOptional()
    driverId?: string;

    @IsUUID()
    @IsOptional()
    vehicleId?: string;

    @IsEnum(DeliveryType)
    @IsOptional()
    type?: DeliveryType;

    @IsString()
    @IsOptional()
    description?: string;

    @IsObject()
    @IsOptional()
    originAddress?: Address;

    @IsObject()
    @IsNotEmpty()
    destinationAddress: Address;
}
