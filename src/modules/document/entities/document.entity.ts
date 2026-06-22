import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
} from 'typeorm';
import { TenantAwareEntity } from '../../../common/entities/tenant-aware.entity';
import { Organization } from '../../organization/entities/organization.entity';
import { Vehicle } from '../../vehicle/entities/vehicle.entity';
import { Driver } from '../../driver/entities/driver.entity';

export enum DocumentStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  EXPIRED = 'EXPIRED',
}

@Entity()
export class Document extends TenantAwareEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  organizationId: string;

  @ManyToOne(() => Organization, (org) => org.documents, { onDelete: 'CASCADE' })
  organization: Organization;

  @Column({ nullable: true })
  vehicleId: string;

  @ManyToOne(() => Vehicle, (vehicle) => vehicle.documents, { onDelete: 'CASCADE' })
  vehicle: Vehicle;

  @Column({ nullable: true })
  driverId: string;

  @ManyToOne(() => Driver, (driver) => driver.documents, { onDelete: 'CASCADE' })
  driver: Driver;

  @Column()
  type: string;

  @Column()
  name: string;

  @Column()
  fileUrl: string;

  @Column({ nullable: true })
  fileSize: number;

  @Column({ nullable: true })
  mimeType: string;

  @Column({
    type: 'simple-enum',
    enum: DocumentStatus,
    default: DocumentStatus.PENDING,
  })
  status: DocumentStatus;

  @Column({ nullable: true })
  expiresAt: Date;

  @Column({ nullable: true })
  approvedBy: string;

  @Column({ nullable: true })
  approvedAt: Date;

  @Column({ nullable: true })
  rejectedReason: string;

  @Column({ type: 'json', nullable: true })
  metadata: Record<string, unknown>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
