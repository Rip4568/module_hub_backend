import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { CategoryService } from './category.service';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { ModuleGuard } from '../../common/guards/module.guard';
import { PermissionGuard } from '../../common/guards/permission.guard';
import { RequiresModule } from '../../common/decorators/requires-module.decorator';
import { RequiresPermission } from '../../common/decorators/requires-permission.decorator';
import { Permissions } from '../../common/constants/permissions';

@Controller('categories')
@UseGuards(JwtAuthGuard, TenantGuard, ModuleGuard, PermissionGuard)
@RequiresModule('ecommerce')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) { }

  @Post()
  @RequiresPermission(Permissions.CREATE_CATEGORY)
  create(@CurrentTenant() tenantId: string, @Body() createCategoryDto: any) {
    return this.categoryService.create(tenantId, createCategoryDto);
  }

  @Get()
  @RequiresPermission(Permissions.READ_CATEGORY)
  findAll(@CurrentTenant() tenantId: string) {
    return this.categoryService.findAll(tenantId);
  }

  @Get(':id')
  @RequiresPermission(Permissions.READ_CATEGORY)
  findOne(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    return this.categoryService.findOne(tenantId, id);
  }

  @Put(':id')
  @RequiresPermission(Permissions.UPDATE_CATEGORY)
  update(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
    @Body() updateCategoryDto: any,
  ) {
    return this.categoryService.update(tenantId, id, updateCategoryDto);
  }

  @Delete(':id')
  @RequiresPermission(Permissions.DELETE_CATEGORY)
  remove(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    return this.categoryService.remove(tenantId, id);
  }
}
