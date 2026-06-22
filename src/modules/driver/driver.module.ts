import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Driver } from './entities/driver.entity';
import { DriverVehicle } from './entities/driver-vehicle.entity';
import { DriverService } from './driver.service';
import { DriverController } from './driver.controller';
import { TenantModuleModule } from '../tenant-module/tenant-module.module';
import { PermissionModule } from '../permission/permission.module';
import { UserModule } from '../user/user.module';
import { TenantModule } from '../tenant/tenant.module';
import { EmailModule } from '../../infrastructure/email/email.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Driver, DriverVehicle]),
    TenantModuleModule,
    PermissionModule,
    UserModule,
    TenantModule,
    EmailModule,
  ],
  controllers: [DriverController],
  providers: [DriverService],
  exports: [DriverService],
})
export class DriverModule {}
