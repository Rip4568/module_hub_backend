import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Driver } from './entities/driver.entity';
import { DriverVehicle } from './entities/driver-vehicle.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Driver, DriverVehicle])],
})
export class DriverModule {}
