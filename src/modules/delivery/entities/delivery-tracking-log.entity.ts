import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne } from 'typeorm';
import { Delivery } from './delivery.entity';
import { TenantAwareEntity } from '../../../common/entities/tenant-aware.entity';

@Entity('delivery_tracking_logs')
export class DeliveryTrackingLog extends TenantAwareEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  deliveryId: string;

  @ManyToOne(() => Delivery, { onDelete: 'CASCADE' })
  delivery: Delivery;

  @Column({ type: 'decimal', precision: 10, scale: 8 })
  lat: number;

  @Column({ type: 'decimal', precision: 11, scale: 8 })
  lng: number;

  @Column({ type: 'int', nullable: true })
  batteryLevel: number;

  @Column({ type: 'datetime' })
  timestamp: Date;

  @CreateDateColumn()
  createdAt: Date;
}
