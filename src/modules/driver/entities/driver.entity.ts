import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  Unique,
  JoinColumn,
  OneToOne,
} from 'typeorm';
import { TenantAwareEntity } from '../../../common/entities/tenant-aware.entity';
import { User } from '../../user/entities/user.entity';
import { Organization } from '../../organization/entities/organization.entity';
import { Document } from '../../document/entities/document.entity';
import { DriverVehicle } from './driver-vehicle.entity';
import { Order } from '../../order/entities/order.entity';
import { Delivery } from '../../delivery/entities/delivery.entity';

export enum DriverStatus {
  ACTIVE = 'ACTIVE',
  PENDING = 'PENDING',
  BLOCKED = 'BLOCKED',
  INACTIVE = 'INACTIVE',
}

@Entity()
export class Driver extends TenantAwareEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @OneToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn()
  user: User;

  @Column({ nullable: true })
  organizationId: string;

  @ManyToOne(() => Organization, (org) => org.drivers)
  organization: Organization;

  @Column({ nullable: true })
  rg: string;

  @Column({ unique: true })
  cpf: string;

  @Column({ nullable: true })
  birthDate: Date;

  @Column({ nullable: true })
  cnhNumber: string;

  @Column({ nullable: true })
  cnhCategory: string;

  @Column({ nullable: true })
  cnhExpiry: Date;

  @OneToMany(() => Document, (document) => document.driver)
  documents: Document[];

  @Column({ nullable: true })
  photo: string;

  @Column({ nullable: true })
  selfie: string;

  @Column({
    type: 'simple-enum',
    enum: DriverStatus,
    default: DriverStatus.PENDING,
  })
  status: DriverStatus;

  @Column({ nullable: true })
  approvedAt: Date;

  @Column({ nullable: true })
  approvedBy: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => DriverVehicle, (driverVehicle) => driverVehicle.driver)
  vehicles: DriverVehicle[];

  @OneToMany(() => Order, (order) => order.driver)
  orders: Order[];

  @OneToMany(() => Delivery, (delivery) => delivery.driver)
  deliveries: Delivery[];
}
