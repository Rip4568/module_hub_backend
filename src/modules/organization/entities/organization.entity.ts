import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  Relation,
  Unique,
} from 'typeorm';
import { TenantAwareEntity } from '../../../common/entities/tenant-aware.entity';
import { Tenant } from '../../tenant/entities/tenant.entity';
import { Address } from './address.entity';
import { Document } from '../../document/entities/document.entity';
import { BankAccount } from '../../financial/entities/bank-account.entity';
import { User } from '../../user/entities/user.entity';
import { Vehicle } from '../../vehicle/entities/vehicle.entity';
import { Driver } from '../../driver/entities/driver.entity';
import { Order } from '../../order/entities/order.entity';

export enum DocumentType {
  CPF = 'CPF',
  CNPJ = 'CNPJ',
}

export enum OrganizationStatus {
  ACTIVE = 'ACTIVE',
  PENDING = 'PENDING',
  BLOCKED = 'BLOCKED',
  INACTIVE = 'INACTIVE',
}

@Entity()
@Unique(['tenantId', 'documentNumber'])
export class Organization extends TenantAwareEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Tenant, { onDelete: 'CASCADE' })
  tenant: Relation<Tenant>;

  @Column()
  legalName: string;

  @Column({ nullable: true })
  tradeName: string;

  @Column({
    type: 'enum',
    enum: DocumentType,
  })
  documentType: DocumentType;

  @Column()
  documentNumber: string;

  @Column({ nullable: true })
  stateRegistration: string;

  @Column({ nullable: true })
  category: string;

  @Column({ nullable: true })
  type: string;

  @Column({ nullable: true })
  email: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ nullable: true })
  whatsapp: string;

  @Column({ nullable: true })
  responsibleName: string;

  @Column({
    type: 'enum',
    enum: OrganizationStatus,
    default: OrganizationStatus.PENDING,
  })
  status: OrganizationStatus;

  @Column({ type: 'int', nullable: true })
  paymentTerm: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  minimumPurchase: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  commission: number;

  @Column('simple-array', { nullable: true })
  serviceRegions: string[];

  @Column({ type: 'json', nullable: true })
  metadata: any;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ nullable: true })
  approvedAt: Date;

  @OneToMany(() => Address, (address) => address.organization)
  addresses: Relation<Address[]>;

  @OneToMany(() => Document, (document) => document.organization)
  documents: Relation<Document[]>;

  @OneToMany(() => BankAccount, (account) => account.organization)
  bankAccounts: Relation<BankAccount[]>;

  @OneToMany(() => User, (user) => user.organization)
  users: Relation<User[]>;

  @OneToMany(() => Vehicle, (vehicle) => vehicle.organization)
  vehicles: Relation<Vehicle[]>;

  @OneToMany(() => Driver, (driver) => driver.organization)
  drivers: Relation<Driver[]>;

  @OneToMany(() => Order, (order) => order.organization)
  orders: Relation<Order[]>;
}
