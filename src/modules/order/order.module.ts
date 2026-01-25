import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { OrderService } from './order.service';
import { OrderController } from './order.controller';
import { TenantModuleModule } from '../tenant-module/tenant-module.module';
import { PermissionModule } from '../permission/permission.module';
import { getRepositoryToken } from '@nestjs/typeorm';
import { TenantRepository } from '../../common/repositories/tenant.repository';
import { DataSource } from 'typeorm';
import { ClsService } from 'nestjs-cls';

@Module({
  imports: [
    TypeOrmModule.forFeature([Order, OrderItem]),
    TenantModuleModule,
    PermissionModule
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
  ],
  exports: [OrderService],
})
export class OrderModule { }
