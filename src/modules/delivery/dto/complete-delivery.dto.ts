import { IsString, IsNotEmpty, IsOptional, IsUrl } from 'class-validator';

export class CompleteDeliveryDto {
  @IsUrl()
  @IsNotEmpty()
  photoUrl: string;

  @IsString()
  @IsNotEmpty()
  signature: string;

  @IsString()
  @IsNotEmpty()
  signedBy: string;

  @IsString()
  @IsOptional()
  notes?: string;
}
