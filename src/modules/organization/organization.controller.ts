import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { OrganizationService } from './organization.service';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { ModuleGuard } from '../../common/guards/module.guard';
import { PermissionGuard } from '../../common/guards/permission.guard';
import { RequiresModule } from '../../common/decorators/requires-module.decorator';
import { RequiresPermission } from '../../common/decorators/requires-permission.decorator';

@Controller('organizations')
@UseGuards(JwtAuthGuard, TenantGuard, ModuleGuard, PermissionGuard)
@RequiresModule('multi_organization')
export class OrganizationController {
  constructor(private readonly organizationService: OrganizationService) {}

  @Post()
  @RequiresPermission('can_create_supplier') // Using supplier permissions as example from prompt, or generic organization ones
  create(@CurrentTenant() tenantId: string, @Body() createOrganizationDto: any) {
    return this.organizationService.create(tenantId, createOrganizationDto);
  }

  @Get()
  @RequiresPermission('can_read_supplier')
  findAll(@CurrentTenant() tenantId: string) {
    return this.organizationService.findAll(tenantId);
  }

  @Get(':id')
  @RequiresPermission('can_read_supplier')
  findOne(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    return this.organizationService.findOne(tenantId, id);
  }

  @Put(':id')
  @RequiresPermission('can_update_supplier')
  update(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
    @Body() updateOrganizationDto: any,
  ) {
    return this.organizationService.update(tenantId, id, updateOrganizationDto);
  }

  @Delete(':id')
  @RequiresPermission('can_delete_supplier')
  remove(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    return this.organizationService.remove(tenantId, id);
  }

  @Post(':id/approve')
  @RequiresPermission('can_approve_supplier')
  approve(@CurrentTenant() tenantId: string, @Param('id') id: string) {
      return this.organizationService.approve(tenantId, id);
  }

  @Post(':id/block')
  @RequiresPermission('can_block_supplier')
  block(@CurrentTenant() tenantId: string, @Param('id') id: string) {
      return this.organizationService.block(tenantId, id);
  }
}
