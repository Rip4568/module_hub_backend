import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DriverPortalController } from './driver-portal.controller';
import { DriverPortalService } from './driver-portal.service';
import { Driver } from '../driver/entities/driver.entity';
import { DriverVehicle } from '../driver/entities/driver-vehicle.entity';
import { Tenant } from '../tenant/entities/tenant.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([Driver, DriverVehicle, Tenant])
    ],
    controllers: [DriverPortalController],
    providers: [DriverPortalService],
})
export class DriverPortalModule { }
