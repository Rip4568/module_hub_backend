import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { Order } from '../../order/entities/order.entity';
import { Driver } from '../../driver/entities/driver.entity';
import { Address } from '../../../common/interfaces/address.interface';
import { TenantAwareEntity } from '../../../common/entities/tenant-aware.entity';

export enum DeliveryStatus {
  PENDING = 'PENDING',
  IN_ROUTE = 'IN_ROUTE',
  ARRIVED = 'ARRIVED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum DeliveryType {
  STANDARD = 'STANDARD',
  SERVICE = 'SERVICE',
  INTERNAL_TRANSFER = 'INTERNAL_TRANSFER',
}

@Entity()
export class Delivery extends TenantAwareEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  orderId: string;

  @OneToOne(() => Order, (order) => order.delivery, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn()
  order: Order;

  @Column({
    type: 'simple-enum',
    enum: DeliveryType,
    default: DeliveryType.STANDARD,
  })
  type: DeliveryType;

  @Column({ nullable: true })
  description: string;

  @Column({ nullable: true })
  driverId: string | null;

  @ManyToOne(() => Driver, (driver) => driver.deliveries, { nullable: true })
  driver: Driver;

  @Column({ nullable: true })
  vehicleId: string;

  @Column({
    type: 'simple-enum',
    enum: DeliveryStatus,
    default: DeliveryStatus.PENDING,
  })
  status: DeliveryStatus;

  @Column({ type: 'json', nullable: true })
  originAddress: Address;

  @Column({ type: 'json', nullable: true })
  destinationAddress: Address;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  distance: number;

  @Column({ type: 'int', nullable: true })
  estimatedTime: number;

  @Column({ nullable: true })
  startedAt: Date;

  @Column({ nullable: true })
  arrivedAt: Date;

  @Column({ nullable: true })
  completedAt: Date;

  @Column({ type: 'decimal', precision: 10, scale: 8, nullable: true })
  currentLat: number;

  @Column({ type: 'decimal', precision: 11, scale: 8, nullable: true })
  currentLng: number;

  @Column({ nullable: true })
  photoUrl: string;

  @Column({ nullable: true })
  signature: string;

  @Column({ nullable: true })
  signedBy: string;

  @Column({ nullable: true })
  notes: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
