import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ProductService } from './product.service';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { ModuleGuard } from '../../common/guards/module.guard';
import { PermissionGuard } from '../../common/guards/permission.guard';
import { RequiresModule } from '../../common/decorators/requires-module.decorator';
import { RequiresPermission } from '../../common/decorators/requires-permission.decorator';
import { Permissions } from '../../common/constants/permissions';

@Controller('products')
@UseGuards(JwtAuthGuard, TenantGuard, ModuleGuard, PermissionGuard)
@RequiresModule('ecommerce')
export class ProductController {
  constructor(private readonly productService: ProductService) { }

  @Post()
  @RequiresPermission(Permissions.CREATE_PRODUCT)
  create(@CurrentTenant() tenantId: string, @Body() createProductDto: any) {
    return this.productService.create(tenantId, createProductDto);
  }

  @Get()
  @RequiresPermission(Permissions.READ_PRODUCT)
  findAll(@CurrentTenant() tenantId: string, @Query() query: any) {
    return this.productService.findAll(tenantId, query);
  }

  @Get(':id')
  @RequiresPermission(Permissions.READ_PRODUCT)
  findOne(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    return this.productService.findOne(tenantId, id);
  }

  @Put(':id')
  @RequiresPermission(Permissions.UPDATE_PRODUCT)
  update(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
    @Body() updateProductDto: any,
  ) {
    return this.productService.update(tenantId, id, updateProductDto);
  }

  @Delete(':id')
  @RequiresPermission(Permissions.DELETE_PRODUCT)
  remove(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    return this.productService.remove(tenantId, id);
  }

  @Post(':id/publish')
  @RequiresPermission(Permissions.PUBLISH_PRODUCT)
  publish(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    return this.productService.publish(tenantId, id);
  }
}
