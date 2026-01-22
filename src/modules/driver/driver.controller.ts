import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { DriverService } from './driver.service';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { ModuleGuard } from '../../common/guards/module.guard';
import { PermissionGuard } from '../../common/guards/permission.guard';
import { RequiresModule } from '../../common/decorators/requires-module.decorator';
import { RequiresPermission } from '../../common/decorators/requires-permission.decorator';
import { Permissions } from '../../common/constants/permissions';

@Controller('drivers')
@UseGuards(JwtAuthGuard, TenantGuard, ModuleGuard, PermissionGuard)
@RequiresModule('drivers_management')
export class DriverController {
  constructor(private readonly driverService: DriverService) { }

  @Post()
  @RequiresPermission(Permissions.CREATE_DRIVER)
  create(@CurrentTenant() tenantId: string, @Body() createDriverDto: any) {
    return this.driverService.create(tenantId, createDriverDto);
  }

  @Get()
  @RequiresPermission(Permissions.READ_DRIVER)
  findAll(@CurrentTenant() tenantId: string) {
    return this.driverService.findAll(tenantId);
  }

  @Get(':id')
  @RequiresPermission(Permissions.READ_DRIVER)
  findOne(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    return this.driverService.findOne(tenantId, id);
  }

  @Put(':id')
  @RequiresPermission(Permissions.UPDATE_DRIVER)
  update(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
    @Body() updateDriverDto: any,
  ) {
    return this.driverService.update(tenantId, id, updateDriverDto);
  }

  @Delete(':id')
  @RequiresPermission(Permissions.DELETE_DRIVER)
  remove(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    return this.driverService.remove(tenantId, id);
  }

  @Post(':id/approve')
  @RequiresPermission(Permissions.APPROVE_DRIVER)
  approve(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    return this.driverService.approve(tenantId, id);
  }

  @Post(':id/block')
  @RequiresPermission(Permissions.BLOCK_DRIVER)
  block(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    return this.driverService.block(tenantId, id);
  }
}
