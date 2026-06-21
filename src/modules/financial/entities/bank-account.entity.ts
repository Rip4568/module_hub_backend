import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany } from 'typeorm';
import { Organization } from '../../organization/entities/organization.entity';
import { Transaction } from './transaction.entity';
import { TenantAwareEntity } from '../../../common/entities/tenant-aware.entity';

export enum AccountType {
  CHECKING = 'CHECKING',
  SAVINGS = 'SAVINGS',
}

export enum PixKeyType {
  CPF = 'CPF',
  CNPJ = 'CNPJ',
  EMAIL = 'EMAIL',
  PHONE = 'PHONE',
  RANDOM = 'RANDOM',
}

@Entity()
export class BankAccount extends TenantAwareEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  organizationId: string;

  @ManyToOne(() => Organization, (org) => org.bankAccounts, { onDelete: 'CASCADE' })
  organization: Organization;

  @Column()
  bankCode: string;

  @Column()
  bankName: string;

  @Column({
    type: 'simple-enum',
    enum: AccountType,
  })
  accountType: AccountType;

  @Column()
  agency: string;

  @Column({ nullable: true })
  agencyDigit: string;

  @Column()
  accountNumber: string;

  @Column()
  accountDigit: string;

  @Column()
  holderName: string;

  @Column()
  holderDocument: string;

  @Column({ nullable: true })
  pixKey: string;

  @Column({
    type: 'simple-enum',
    enum: PixKeyType,
    nullable: true,
  })
  pixKeyType: PixKeyType;

  @Column({ default: false })
  isDefault: boolean;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => Transaction, (transaction) => transaction.bankAccount)
  transactions: Transaction[];
}
