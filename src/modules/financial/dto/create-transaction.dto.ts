import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID } from 'class-validator';
import { TransactionStatus, TransactionType } from '../entities/transaction.entity';

export class CreateTransactionDto {
  @IsOptional()
  @IsUUID()
  organizationId?: string;

  @IsOptional()
  @IsUUID()
  bankAccountId?: string;

  @IsOptional()
  @IsUUID()
  orderId?: string;

  @IsEnum(TransactionType)
  type: TransactionType;

  @IsNumber()
  amount: number;

  @IsOptional()
  @IsEnum(TransactionStatus)
  status?: TransactionStatus;

  @IsOptional()
  scheduledFor?: Date;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  description?: string;

  @IsOptional()
  metadata?: Record<string, unknown>;
}
