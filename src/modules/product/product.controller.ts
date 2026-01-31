import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ProductService } from './product.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { ModuleGuard } from '../../common/guards/module.guard';
import { PermissionGuard } from '../../common/guards/permission.guard';
import { RequiresModule } from '../../common/decorators/requires-module.decorator';
import { RequiresPermission } from '../../common/decorators/requires-permission.decorator';
import { Permissions } from '../../common/constants/permissions';

import { CreateProductDto } from './dto/create-product.dto';

@Controller('products')
@UseGuards(JwtAuthGuard, TenantGuard, ModuleGuard, PermissionGuard)
@RequiresModule('ecommerce')
export class ProductController {
  constructor(private readonly productService: ProductService) { }

  @Post()
  @RequiresPermission(Permissions.CREATE_PRODUCT)
  create(@Body() createProductDto: CreateProductDto) {
    return this.productService.create(createProductDto);
  }

  @Get()
  @RequiresPermission(Permissions.READ_PRODUCT)
  findAll(@Query() query: any) {
    return this.productService.findAll(query);
  }

  @Get(':id')
  @RequiresPermission(Permissions.READ_PRODUCT)
  findOne(@Param('id') id: string, @Query('withEcommerce') withEcommerce: string) {
    return this.productService.findOne(id, { withEcommerce: withEcommerce === 'true' });
  }

  @Put(':id')
  @RequiresPermission(Permissions.UPDATE_PRODUCT)
  update(
    @Param('id') id: string,
    @Body() updateProductDto: any,
  ) {
    return this.productService.update(id, updateProductDto);
  }

  @Delete(':id')
  @RequiresPermission(Permissions.DELETE_PRODUCT)
  remove(@Param('id') id: string) {
    return this.productService.remove(id);
  }

  @Post(':id/publish')
  @RequiresPermission(Permissions.PUBLISH_PRODUCT)
  publish(@Param('id') id: string) {
    return this.productService.publish(id);
  }
}
