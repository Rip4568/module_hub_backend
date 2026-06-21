import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from './entities/product.entity';
import { ProductCategory } from './entities/product-category.entity';
import { ProductVariant } from './entities/product-variant.entity';
import { ProductEcommerceProfile } from './entities/ecommerce-profile.entity';
import { InventoryLog } from './entities/inventory-log.entity';
import { StockLevel } from './entities/stock-level.entity';
import { InventoryMovement } from './entities/inventory-movement.entity';
import { ProductService } from './product.service';
import { InventoryService } from './inventory.service';
import { ProductController } from './product.controller';
import { ProductStorefrontController } from './product-storefront.controller';
import { InventoryController } from './inventory.controller';
import { TenantModuleModule } from '../tenant-module/tenant-module.module';
import { PermissionModule } from '../permission/permission.module';
import { getRepositoryToken } from '@nestjs/typeorm';
import { TenantRepository } from '../../common/repositories/tenant.repository';
import { DataSource } from 'typeorm';
import { ClsService } from 'nestjs-cls';
import { OrderInventoryListener } from './listeners/order-inventory.listener';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Product,
      ProductCategory,
      ProductVariant,
      ProductEcommerceProfile,
      InventoryLog,
      StockLevel,
      InventoryMovement
    ]),
    TenantModuleModule,
    PermissionModule,
  ],
  controllers: [ProductController, ProductStorefrontController, InventoryController],
  providers: [
    ProductService,
    InventoryService,
    OrderInventoryListener,
    {
      provide: getRepositoryToken(Product),
      inject: [DataSource, ClsService],
      useFactory: (dataSource: DataSource, cls: ClsService) => {
        return new TenantRepository(Product, dataSource.manager, dataSource.createQueryRunner(), cls);
      },
    },
    {
      provide: getRepositoryToken(ProductEcommerceProfile),
      inject: [DataSource, ClsService],
      useFactory: (dataSource: DataSource, cls: ClsService) => {
        return new TenantRepository(ProductEcommerceProfile, dataSource.manager, dataSource.createQueryRunner(), cls);
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
      provide: getRepositoryToken(StockLevel),
      inject: [DataSource, ClsService],
      useFactory: (dataSource: DataSource, cls: ClsService) => {
        return new TenantRepository(StockLevel, dataSource.manager, dataSource.createQueryRunner(), cls);
      },
    },
    {
      provide: getRepositoryToken(InventoryMovement),
      inject: [DataSource, ClsService],
      useFactory: (dataSource: DataSource, cls: ClsService) => {
        return new TenantRepository(InventoryMovement, dataSource.manager, dataSource.createQueryRunner(), cls);
      },
    },
  ],
  exports: [ProductService, InventoryService],
})
export class ProductModule { }
