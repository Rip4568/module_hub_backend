import { IsEmail, IsNotEmpty, IsString, IsUUID, IsOptional } from 'class-validator';

export class LoginDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  password: string;

  @IsUUID()
  @IsOptional()
  tenantId?: string;
}
