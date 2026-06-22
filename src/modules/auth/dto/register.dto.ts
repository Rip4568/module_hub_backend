import { IsOptional, IsString, IsUUID } from 'class-validator';
import { CreateUserDto } from '../../user/dto/create-user.dto';

export class RegisterDto extends CreateUserDto {
  @IsOptional()
  @IsString()
  tenantName?: string;

  @IsOptional()
  @IsUUID()
  override tenantId: string;
}
