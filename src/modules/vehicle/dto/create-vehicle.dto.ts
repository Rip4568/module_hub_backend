import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, IsArray } from 'class-validator';
import { VehicleType, FuelType, VehicleStatus } from '../entities/vehicle.entity';

export class CreateVehicleDto {
  @IsEnum(VehicleType)
  @IsOptional()
  type?: VehicleType;

  @IsString()
  @IsNotEmpty()
  brand: string;

  @IsString()
  @IsNotEmpty()
  model: string;

  @IsNumber()
  @IsNotEmpty()
  year: number;

  @IsString()
  @IsOptional()
  color?: string;

  @IsString()
  @IsNotEmpty()
  plate: string;

  @IsString()
  @IsOptional()
  renavam?: string;

  @IsString()
  @IsOptional()
  chassis?: string;

  @IsNumber()
  @IsOptional()
  loadCapacity?: number;

  @IsEnum(FuelType)
  @IsOptional()
  fuelType?: FuelType;

  @IsString()
  @IsOptional()
  insuranceCompany?: string;

  @IsOptional()
  insuranceExpiry?: Date;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  photos?: string[];
}
