import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Delivery } from './entities/delivery.entity';
import { DeliveryTrackingLog } from './entities/delivery-tracking-log.entity';
import { DeliveryDocument } from './entities/delivery-document.entity';
import { DeliveryService } from './delivery.service';
import { DeliveryController } from './delivery.controller';
import { getRepositoryToken } from '@nestjs/typeorm';
import { TenantRepository } from '../../common/repositories/tenant.repository';
import { DataSource } from 'typeorm';
import { ClsService } from 'nestjs-cls';
import { TenantModuleModule } from '../tenant-module/tenant-module.module';
import { PermissionModule } from '../permission/permission.module';
import { ActivityLogModule } from '../activity-log/activity-log.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Delivery, DeliveryTrackingLog, DeliveryDocument]),
    TenantModuleModule,
    PermissionModule,
    ActivityLogModule,
  ],
  controllers: [DeliveryController],
  providers: [
    DeliveryService,
    {
      provide: getRepositoryToken(Delivery),
      inject: [DataSource, ClsService],
      useFactory: (dataSource: DataSource, cls: ClsService) => {
        return new TenantRepository(
          Delivery,
          dataSource.manager,
          dataSource.createQueryRunner(),
          cls,
        );
      },
    },
    {
      provide: getRepositoryToken(DeliveryTrackingLog),
      inject: [DataSource, ClsService],
      useFactory: (dataSource: DataSource, cls: ClsService) => {
        return new TenantRepository(
          DeliveryTrackingLog,
          dataSource.manager,
          dataSource.createQueryRunner(),
          cls,
        );
      },
    },
    {
      provide: getRepositoryToken(DeliveryDocument),
      inject: [DataSource, ClsService],
      useFactory: (dataSource: DataSource, cls: ClsService) => {
        return new TenantRepository(
          DeliveryDocument,
          dataSource.manager,
          dataSource.createQueryRunner(),
          cls,
        );
      },
    },
  ],
  exports: [DeliveryService],
})
export class DeliveryModule {}
