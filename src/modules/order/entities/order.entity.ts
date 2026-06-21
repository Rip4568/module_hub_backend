import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, Unique, OneToOne, JoinColumn } from 'typeorm';
import { Tenant } from '../../tenant/entities/tenant.entity';
import { Organization } from '../../organization/entities/organization.entity';
import { Driver } from '../../driver/entities/driver.entity';
import { Vehicle } from '../../vehicle/entities/vehicle.entity';
import { User } from '../../user/entities/user.entity';
import { OrderItem } from './order-item.entity';
import { Delivery } from '../../delivery/entities/delivery.entity';
import { Transaction } from '../../financial/entities/transaction.entity';
import { Address } from '../../../common/interfaces/address.interface';
import { TenantAwareEntity } from '../../../common/entities/tenant-aware.entity';
import { Customer } from '../../customer/entities/customer.entity';

export enum OrderStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  ASSIGNED = 'ASSIGNED',
  IN_ROUTE = 'IN_ROUTE',
  DELIVERED = 'DELIVERED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  PAID = 'PAID',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
}

@Entity()
export class Order extends TenantAwareEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Tenant, { onDelete: 'CASCADE' })
  tenant: Tenant;

  @Column({ unique: true })
  orderNumber: string;

  @Column()
  customerName: string;

  @Column({ nullable: true })
  customerEmail: string;

  @Column({ nullable: true })
  customerPhone: string;

  @Column({ nullable: true })
  customerDocument: string;

  @Column({ type: 'json' })
  shippingAddress: Address;

  @Column({ nullable: true })
  organizationId: string;

  @ManyToOne(() => Organization, (org) => org.orders)
  organization: Organization;

  @Column({ nullable: true })
  driverId: string;

  @ManyToOne(() => Driver, (driver) => driver.orders)
  driver: Driver;

  @Column({ nullable: true })
  vehicleId: string;

  @ManyToOne(() => Vehicle, (vehicle) => vehicle.orders)
  vehicle: Vehicle;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  subtotal: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  shippingCost: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  discount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  tax: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  total: number;

  @Column({
    type: 'simple-enum',
    enum: OrderStatus,
    default: OrderStatus.PENDING,
  })
  status: OrderStatus;

  @Column({
    type: 'simple-enum',
    enum: PaymentStatus,
    default: PaymentStatus.PENDING,
  })
  paymentStatus: PaymentStatus;

  @Column({ nullable: true })
  acceptedAt: Date;

  @Column({ nullable: true })
  assignedAt: Date;

  @Column({ nullable: true })
  inRouteAt: Date;

  @Column({ nullable: true })
  deliveredAt: Date;

  @Column({ nullable: true })
  completedAt: Date;

  @Column({ nullable: true })
  cancelledAt: Date;

  @Column({ nullable: true })
  cancelReason: string;

  @Column({ nullable: true })
  notes: string;

  @Column({ nullable: true })
  internalNotes: string;

  @Column({ nullable: true })
  trackingCode: string;

  @Column({ type: 'json', nullable: true })
  metadata: any;

  @Column()
  createdById: string;

  @ManyToOne(() => User)
  createdBy: User;

  @Column({ nullable: true })
  assignedToId: string;

  @ManyToOne(() => User)
  assignedTo: User;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => OrderItem, (item) => item.order)
  items: OrderItem[];

  @OneToOne(() => Delivery, (delivery) => delivery.order)
  delivery: Delivery;

  @OneToMany(() => Transaction, (transaction) => transaction.order)
  transactions: Transaction[];

  @Column({ nullable: true })
  customerId: string;

  @ManyToOne(() => Customer)
  customer: Customer;
}
