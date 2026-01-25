import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToOne, JoinColumn } from 'typeorm';
import { Order } from '../../order/entities/order.entity';
import { Driver } from '../../driver/entities/driver.entity';
import { Address } from '../../../common/interfaces/address.interface';
import { TenantAwareEntity } from '../../../common/entities/tenant-aware.entity';

@Entity()
export class Delivery extends TenantAwareEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  orderId: string;

  @OneToOne(() => Order, (order) => order.delivery, { onDelete: 'CASCADE' })
  @JoinColumn()
  order: Order;

  @Column()
  driverId: string;

  @ManyToOne(() => Driver, (driver) => driver.deliveries)
  driver: Driver;

  @Column({ type: 'json' })
  originAddress: Address;

  @Column({ type: 'json' })
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
