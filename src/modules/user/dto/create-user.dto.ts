import { IsEmail, IsNotEmpty, IsString, MinLength, IsOptional, IsUUID } from 'class-validator';

export class CreateUserDto {
    @IsEmail()
    @IsNotEmpty()
    email: string;

    @IsString()
    @IsNotEmpty()
    @MinLength(6)
    password: string;

    @IsString()
    @IsNotEmpty()
    name: string;

    @IsOptional()
    @IsUUID()
    tenantId?: string;

    @IsOptional()
    @IsString()
    phone?: string;

    @IsOptional()
    @IsString()
    avatar?: string;
}
