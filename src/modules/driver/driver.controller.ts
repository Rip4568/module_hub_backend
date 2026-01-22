import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { DriverService } from './driver.service';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { ModuleGuard } from '../../common/guards/module.guard';
import { PermissionGuard } from '../../common/guards/permission.guard';
import { RequiresModule } from '../../common/decorators/requires-module.decorator';
import { RequiresPermission } from '../../common/decorators/requires-permission.decorator';

@Controller('drivers')
@UseGuards(JwtAuthGuard, TenantGuard, ModuleGuard, PermissionGuard)
@RequiresModule('drivers_management')
export class DriverController {
  constructor(private readonly driverService: DriverService) {}

  @Post()
  @RequiresPermission('can_create_driver')
  create(@CurrentTenant() tenantId: string, @Body() createDriverDto: any) {
    return this.driverService.create(tenantId, createDriverDto);
  }

  @Get()
  @RequiresPermission('can_read_driver')
  findAll(@CurrentTenant() tenantId: string) {
    return this.driverService.findAll(tenantId);
  }

  @Get(':id')
  @RequiresPermission('can_read_driver')
  findOne(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    return this.driverService.findOne(tenantId, id);
  }

  @Put(':id')
  @RequiresPermission('can_update_driver')
  update(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
    @Body() updateDriverDto: any,
  ) {
    return this.driverService.update(tenantId, id, updateDriverDto);
  }

  @Delete(':id')
  @RequiresPermission('can_delete_driver')
  remove(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    return this.driverService.remove(tenantId, id);
  }

  @Post(':id/approve')
  @RequiresPermission('can_approve_driver')
  approve(@CurrentTenant() tenantId: string, @Param('id') id: string) {
      return this.driverService.approve(tenantId, id);
  }

  @Post(':id/block')
  @RequiresPermission('can_block_driver')
  block(@CurrentTenant() tenantId: string, @Param('id') id: string) {
      return this.driverService.block(tenantId, id);
  }
}
