import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { OrderService } from './order.service';
import { OrderController } from './order.controller';
import { TenantModuleModule } from '../tenant-module/tenant-module.module';
import { PermissionModule } from '../permission/permission.module';
import { InventoryLog } from '../product/entities/inventory-log.entity';
import { Delivery } from '../delivery/entities/delivery.entity';
import { Transaction } from '../financial/entities/transaction.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { TenantRepository } from '../../common/repositories/tenant.repository';
import { DataSource } from 'typeorm';
import { ClsService } from 'nestjs-cls';
import { CustomerModule } from '../customer/customer.module';
import { ProductModule } from '../product/product.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Order, OrderItem, InventoryLog, Delivery, Transaction]),
    TenantModuleModule,
    PermissionModule,
    CustomerModule,

    forwardRef(() => ProductModule)
  ],
  controllers: [OrderController],
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
      provide: getRepositoryToken(InventoryLog),
      inject: [DataSource, ClsService],
      useFactory: (dataSource: DataSource, cls: ClsService) => {
        return new TenantRepository(InventoryLog, dataSource.manager, dataSource.createQueryRunner(), cls);
      },
    },
    {
      provide: getRepositoryToken(Delivery),
      inject: [DataSource, ClsService],
      useFactory: (dataSource: DataSource, cls: ClsService) => {
        return new TenantRepository(Delivery, dataSource.manager, dataSource.createQueryRunner(), cls);
      },
    },
  ],
  exports: [OrderService],
})
export class OrderModule { }
