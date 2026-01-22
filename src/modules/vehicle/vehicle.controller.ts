import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { VehicleService } from './vehicle.service';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { ModuleGuard } from '../../common/guards/module.guard';
import { PermissionGuard } from '../../common/guards/permission.guard';
import { RequiresModule } from '../../common/decorators/requires-module.decorator';
import { RequiresPermission } from '../../common/decorators/requires-permission.decorator';

@Controller('vehicles')
@UseGuards(JwtAuthGuard, TenantGuard, ModuleGuard, PermissionGuard)
@RequiresModule('fleet_management')
export class VehicleController {
  constructor(private readonly vehicleService: VehicleService) {}

  @Post()
  @RequiresPermission('can_create_vehicle')
  create(@CurrentTenant() tenantId: string, @Body() createVehicleDto: any) {
    return this.vehicleService.create(tenantId, createVehicleDto);
  }

  @Get()
  @RequiresPermission('can_read_vehicle')
  findAll(@CurrentTenant() tenantId: string) {
    return this.vehicleService.findAll(tenantId);
  }

  @Get(':id')
  @RequiresPermission('can_read_vehicle')
  findOne(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    return this.vehicleService.findOne(tenantId, id);
  }

  @Put(':id')
  @RequiresPermission('can_update_vehicle')
  update(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
    @Body() updateVehicleDto: any,
  ) {
    return this.vehicleService.update(tenantId, id, updateVehicleDto);
  }

  @Delete(':id')
  @RequiresPermission('can_delete_vehicle')
  remove(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    return this.vehicleService.remove(tenantId, id);
  }

  @Post(':id/approve')
  @RequiresPermission('can_approve_vehicle')
  approve(@CurrentTenant() tenantId: string, @Param('id') id: string) {
      return this.vehicleService.approve(tenantId, id);
  }

  @Post(':id/maintenance')
  @RequiresPermission('can_set_maintenance')
  setMaintenance(@CurrentTenant() tenantId: string, @Param('id') id: string) {
      return this.vehicleService.setMaintenance(tenantId, id);
  }
}
