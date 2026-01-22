import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ProductService } from './product.service';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { ModuleGuard } from '../../common/guards/module.guard';
import { PermissionGuard } from '../../common/guards/permission.guard';
import { RequiresModule } from '../../common/decorators/requires-module.decorator';
import { RequiresPermission } from '../../common/decorators/requires-permission.decorator';

@Controller('products')
@UseGuards(JwtAuthGuard, TenantGuard, ModuleGuard, PermissionGuard)
@RequiresModule('ecommerce')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Post()
  @RequiresPermission('can_create_product')
  create(@CurrentTenant() tenantId: string, @Body() createProductDto: any) {
    return this.productService.create(tenantId, createProductDto);
  }

  @Get()
  @RequiresPermission('can_read_product')
  findAll(@CurrentTenant() tenantId: string, @Query() query: any) {
    return this.productService.findAll(tenantId, query);
  }

  @Get(':id')
  @RequiresPermission('can_read_product')
  findOne(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    return this.productService.findOne(tenantId, id);
  }

  @Put(':id')
  @RequiresPermission('can_update_product')
  update(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
    @Body() updateProductDto: any,
  ) {
    return this.productService.update(tenantId, id, updateProductDto);
  }

  @Delete(':id')
  @RequiresPermission('can_delete_product')
  remove(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    return this.productService.remove(tenantId, id);
  }

  @Post(':id/publish')
  @RequiresPermission('can_publish_product')
  publish(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    return this.productService.publish(tenantId, id);
  }
}
