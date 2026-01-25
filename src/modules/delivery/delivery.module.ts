import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Delivery } from './entities/delivery.entity';
import { DeliveryService } from './delivery.service';
import { DeliveryController } from './delivery.controller';
import { Order } from '../order/entities/order.entity';
import { Transaction } from '../financial/entities/transaction.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { TenantRepository } from '../../common/repositories/tenant.repository';
import { DataSource } from 'typeorm';
import { ClsService } from 'nestjs-cls';

@Module({
  imports: [TypeOrmModule.forFeature([Delivery, Order, Transaction])],
  controllers: [DeliveryController],
  providers: [
    DeliveryService,
    {
      provide: getRepositoryToken(Delivery),
      inject: [DataSource, ClsService],
      useFactory: (dataSource: DataSource, cls: ClsService) => {
        return new TenantRepository(Delivery, dataSource.manager, dataSource.createQueryRunner(), cls);
      },
    },
    {
      provide: getRepositoryToken(Order),
      inject: [DataSource, ClsService],
      useFactory: (dataSource: DataSource, cls: ClsService) => {
        return new TenantRepository(Order, dataSource.manager, dataSource.createQueryRunner(), cls);
      },
    },
    {
      provide: getRepositoryToken(Transaction),
      inject: [DataSource, ClsService],
      useFactory: (dataSource: DataSource, cls: ClsService) => {
        return new TenantRepository(Transaction, dataSource.manager, dataSource.createQueryRunner(), cls);
      },
    },
  ],
  exports: [DeliveryService],
})
export class DeliveryModule { }
