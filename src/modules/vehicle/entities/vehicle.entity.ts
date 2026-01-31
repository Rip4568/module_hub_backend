import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, Unique } from 'typeorm';
import { TenantAwareEntity } from '../../../common/entities/tenant-aware.entity';
import { Tenant } from '../../tenant/entities/tenant.entity';
import { Organization } from '../../organization/entities/organization.entity';
import { Document } from '../../document/entities/document.entity';
import { DriverVehicle } from '../../driver/entities/driver-vehicle.entity';
import { Order } from '../../order/entities/order.entity';

export enum VehicleType {
  MOTORCYCLE = 'MOTORCYCLE',
  CAR = 'CAR',
  VAN = 'VAN',
  TRUCK = 'TRUCK',
}

export enum FuelType {
  GASOLINE = 'GASOLINE',
  ETHANOL = 'ETHANOL',
  DIESEL = 'DIESEL',
  FLEX = 'FLEX',
  ELECTRIC = 'ELECTRIC',
  HYBRID = 'HYBRID',
}

export enum VehicleStatus {
  ACTIVE = 'ACTIVE',
  MAINTENANCE = 'MAINTENANCE',
  INACTIVE = 'INACTIVE',
}

@Entity()
export class Vehicle extends TenantAwareEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Tenant, { onDelete: 'CASCADE' })
  tenant: Tenant;

  @Column({ nullable: true })
  organizationId: string;

  @ManyToOne(() => Organization, (org) => org.vehicles)
  organization: Organization;

  @Column({
    type: 'enum',
    enum: VehicleType,
  })
  type: VehicleType;

  @Column()
  brand: string;

  @Column()
  model: string;

  @Column('int')
  year: number;

  @Column({ nullable: true })
  color: string;

  @Column({ unique: true })
  plate: string;

  @Column({ nullable: true })
  renavam: string;

  @Column({ nullable: true })
  chassis: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  loadCapacity: number;

  @Column({
    type: 'enum',
    enum: FuelType,
    nullable: true,
  })
  fuelType: FuelType;

  @OneToMany(() => Document, (document) => document.vehicle)
  documents: Document[];

  @Column({ nullable: true })
  insuranceCompany: string;

  @Column({ nullable: true })
  insuranceExpiry: Date;

  @Column('simple-array', { nullable: true })
  photos: string[];

  @Column({
    type: 'enum',
    enum: VehicleStatus,
    default: VehicleStatus.ACTIVE,
  })
  status: VehicleStatus;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => DriverVehicle, (driverVehicle) => driverVehicle.vehicle)
  drivers: DriverVehicle[];

  @OneToMany(() => Order, (order) => order.vehicle)
  orders: Order[];
}
