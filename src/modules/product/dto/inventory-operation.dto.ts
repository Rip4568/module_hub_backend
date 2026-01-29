import { IsEnum, IsNumber, IsOptional, IsUUID, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { StockLocationType } from '../entities/stock-level.entity';

export class TransferInventoryDto {
    @ApiProperty()
    @IsUUID()
    productId: string;

    @ApiProperty({ required: false })
    @IsUUID()
    @IsOptional()
    variantId?: string;

    @ApiProperty()
    @IsNumber()
    @Min(1)
    quantity: number;

    @ApiProperty({ enum: StockLocationType })
    @IsEnum(StockLocationType)
    fromType: StockLocationType;

    @ApiProperty({ required: false })
    @IsUUID()
    @IsOptional()
    fromId?: string; // e.g. vehicleId

    @ApiProperty({ enum: StockLocationType })
    @IsEnum(StockLocationType)
    toType: StockLocationType;

    @ApiProperty({ required: false })
    @IsUUID()
    @IsOptional()
    toId?: string; // e.g. vehicleId
}

export class AdjustInventoryDto {
    @ApiProperty()
    @IsUUID()
    productId: string;

    @ApiProperty({ required: false })
    @IsUUID()
    @IsOptional()
    variantId?: string;

    @ApiProperty()
    @IsNumber()
    quantity: number; // Can be negative for removal

    @ApiProperty({ enum: StockLocationType })
    @IsEnum(StockLocationType)
    locationType: StockLocationType;

    @ApiProperty({ required: false })
    @IsUUID()
    @IsOptional()
    locationId?: string;

    @ApiProperty()
    @IsOptional()
    reason?: string;
}
