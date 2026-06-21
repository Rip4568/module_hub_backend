import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ProductService } from './product.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { ModuleGuard } from '../../common/guards/module.guard';
import { PermissionGuard } from '../../common/guards/permission.guard';
import { RequiresModule } from '../../common/decorators/requires-module.decorator';
import { RequiresPermission } from '../../common/decorators/requires-permission.decorator';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { Permissions } from '../../common/constants/permissions';

import { CreateProductDto } from './dto/create-product.dto';

@ApiTags('Products')
@Controller('products')
@UseGuards(JwtAuthGuard, TenantGuard, ModuleGuard, PermissionGuard)
@RequiresModule('ecommerce')
export class ProductController {
  constructor(private readonly productService: ProductService) { }

  @Post()
  @RequiresPermission(Permissions.CREATE_PRODUCT)
  create(@CurrentTenant() tenantId: string, @Body() createProductDto: CreateProductDto) {
    return this.productService.create({ ...createProductDto, tenantId });
  }

  @Get()
  @RequiresPermission(Permissions.READ_PRODUCT)
  findAll(@CurrentTenant() tenantId: string, @Query() query: any, @Query('page') page?: number, @Query('limit') limit?: number) {
    return this.productService.findAll({ ...query, tenantId, page, limit });
  }

  @Get(':id')
  @RequiresPermission(Permissions.READ_PRODUCT)
  findOne(@CurrentTenant() tenantId: string, @Param('id') id: string, @Query('withEcommerce') withEcommerce: string) {
    return this.productService.findOne(id, { withEcommerce: withEcommerce === 'true', tenantId });
  }

  @Put(':id')
  @RequiresPermission(Permissions.UPDATE_PRODUCT)
  update(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
    @Body() updateProductDto: any,
  ) {
    return this.productService.update(id, { ...updateProductDto, tenantId });
  }

  @Delete(':id')
  @RequiresPermission(Permissions.DELETE_PRODUCT)
  remove(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    return this.productService.remove(id, tenantId);
  }

  @Post(':id/publish')
  @RequiresPermission(Permissions.PUBLISH_PRODUCT)
  publish(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    return this.productService.publish(id, tenantId);
  }
}
