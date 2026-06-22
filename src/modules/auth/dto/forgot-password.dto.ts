import { IsEmail, IsNotEmpty, IsOptional, IsUUID } from 'class-validator';

export class ForgotPasswordDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsOptional()
  @IsUUID()
  tenantId?: string;
}
