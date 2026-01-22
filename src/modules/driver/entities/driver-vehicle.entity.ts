import { Entity, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne, Unique, Column } from 'typeorm';
import { Driver } from './driver.entity';
import { Vehicle } from '../../vehicle/entities/vehicle.entity';

@Entity()
@Unique(['driver', 'vehicle'])
export class DriverVehicle {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  driverId: string;

  @ManyToOne(() => Driver, (driver) => driver.vehicles, { onDelete: 'CASCADE' })
  driver: Driver;

  @Column()
  vehicleId: string;

  @ManyToOne(() => Vehicle, (vehicle) => vehicle.drivers, { onDelete: 'CASCADE' })
  vehicle: Vehicle;

  @Column({ default: false })
  isPrimary: boolean;

  @CreateDateColumn()
  assignedAt: Date;
}
