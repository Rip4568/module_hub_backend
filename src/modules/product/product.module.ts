import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from './entities/product.entity';
import { ProductCategory } from './entities/product-category.entity';
import { ProductVariant } from './entities/product-variant.entity';
import { ProductService } from './product.service';
import { ProductController } from './product.controller';
import { TenantModuleModule } from '../tenant-module/tenant-module.module';
import { PermissionModule } from '../permission/permission.module';
import { getRepositoryToken } from '@nestjs/typeorm';
import { TenantRepository } from '../../common/repositories/tenant.repository';
import { DataSource } from 'typeorm';
import { ClsService } from 'nestjs-cls';

@Module({
  imports: [
    TypeOrmModule.forFeature([Product, ProductCategory, ProductVariant]),
    TenantModuleModule,
    PermissionModule
  ],
  controllers: [ProductController],
  providers: [
    ProductService,
    {
      provide: getRepositoryToken(Product),
      inject: [DataSource, ClsService],
      useFactory: (dataSource: DataSource, cls: ClsService) => {
        return new TenantRepository(Product, dataSource.manager, dataSource.createQueryRunner(), cls);
      },
    },
  ],
  exports: [ProductService],
})
export class ProductModule { }
