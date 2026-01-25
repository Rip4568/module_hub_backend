import { IsString, IsObject, IsNotEmpty, IsUUID } from 'class-validator';
import { Address } from '../../../common/interfaces/address.interface';

export class CreateDeliveryDto {
    @IsUUID()
    @IsNotEmpty()
    orderId: string;

    @IsUUID()
    @IsNotEmpty()
    driverId: string;

    @IsObject()
    @IsNotEmpty()
    originAddress: Address;

    @IsObject()
    @IsNotEmpty()
    destinationAddress: Address;
}
