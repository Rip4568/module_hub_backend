import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class InviteDriverDto {
    @IsEmail()
    @IsNotEmpty()
    email: string;

    @IsString()
    @IsNotEmpty()
    name: string;
}
