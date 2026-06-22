import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { OrderService } from './order.service';
import { OrderController } from './order.controller';
import { OrderStorefrontController } from './order-storefront.controller';
import { TenantModuleModule } from '../tenant-module/tenant-module.module';
import { PermissionModule } from '../permission/permission.module';
import { Delivery } from '../delivery/entities/delivery.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { TenantRepository } from '../../common/repositories/tenant.repository';
import { DataSource } from 'typeorm';
import { ClsService } from 'nestjs-cls';
import { ActivityLogModule } from '../activity-log/activity-log.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Order, OrderItem, Delivery]),
    TenantModuleModule,
    PermissionModule,
    ActivityLogModule,
  ],
  controllers: [OrderController, OrderStorefrontController],
  providers: [
    OrderService,
    {
      provide: getRepositoryToken(Order),
      inject: [DataSource, ClsService],
      useFactory: (dataSource: DataSource, cls: ClsService) => {
        return new TenantRepository(Order, dataSource.manager, dataSource.createQueryRunner(), cls);
      },
    },
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
  ],
  exports: [OrderService],
})
export class OrderModule {}
