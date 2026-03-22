import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne } from 'typeorm';
import { TenantAwareEntity } from '../../../common/entities/tenant-aware.entity';
import { BankAccount } from './bank-account.entity';
import { Order } from '../../order/entities/order.entity';

export enum TransactionType {
  CREDIT = 'CREDIT',
  DEBIT = 'DEBIT',
  TRANSFER = 'TRANSFER',
  REFUND = 'REFUND',
  FEE = 'FEE',
  COMMISSION = 'COMMISSION',
}

export enum TransactionStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
}

@Entity()
export class Transaction extends TenantAwareEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  organizationId: string;

  @Column({ nullable: true })
  bankAccountId: string;

  @ManyToOne(() => BankAccount, (account) => account.transactions)
  bankAccount: BankAccount;

  @Column({ nullable: true })
  orderId: string;

  @ManyToOne(() => Order, (order) => order.transactions)
  order: Order;

  @Column({
    type: 'enum',
    enum: TransactionType,
  })
  type: TransactionType;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column({
    type: 'enum',
    enum: TransactionStatus,
    default: TransactionStatus.PENDING,
  })
  status: TransactionStatus;

  @Column({ nullable: true })
  scheduledFor: Date;

  @Column({ nullable: true })
  processedAt: Date;

  @Column({ nullable: true })
  description: string;

  @Column({ type: 'json', nullable: true })
  metadata: Record<string, unknown>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
