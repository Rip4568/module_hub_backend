import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { VehicleService } from './vehicle.service';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { ModuleGuard } from '../../common/guards/module.guard';
import { PermissionGuard } from '../../common/guards/permission.guard';
import { RequiresModule } from '../../common/decorators/requires-module.decorator';
import { RequiresPermission } from '../../common/decorators/requires-permission.decorator';
import { Permissions } from '../../common/constants/permissions';

import { CreateVehicleDto } from './dto/create-vehicle.dto';

@ApiTags('Vehicles')
@Controller('vehicles')
@UseGuards(JwtAuthGuard, TenantGuard, ModuleGuard, PermissionGuard)
@RequiresModule('fleet_management')
export class VehicleController {
  constructor(private readonly vehicleService: VehicleService) {}

  @Post()
  @RequiresPermission(Permissions.CREATE_VEHICLE)
  create(@CurrentTenant() tenantId: string, @Body() createVehicleDto: CreateVehicleDto) {
    return this.vehicleService.create(tenantId, createVehicleDto);
  }

  @Get()
  @RequiresPermission(Permissions.READ_VEHICLE)
  findAll(
    @CurrentTenant() tenantId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.vehicleService.findAll(tenantId, page, limit);
  }

  @Get(':id')
  @RequiresPermission(Permissions.READ_VEHICLE)
  findOne(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    return this.vehicleService.findOne(tenantId, id);
  }

  @Put(':id')
  @RequiresPermission(Permissions.UPDATE_VEHICLE)
  update(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
    @Body() updateVehicleDto: any,
  ) {
    return this.vehicleService.update(tenantId, id, updateVehicleDto);
  }

  @Delete(':id')
  @RequiresPermission(Permissions.DELETE_VEHICLE)
  remove(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    return this.vehicleService.remove(tenantId, id);
  }

  @Post(':id/approve')
  @RequiresPermission(Permissions.APPROVE_VEHICLE)
  approve(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    return this.vehicleService.approve(tenantId, id);
  }

  @Post(':id/maintenance')
  @RequiresPermission(Permissions.SET_MAINTENANCE)
  setMaintenance(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    return this.vehicleService.setMaintenance(tenantId, id);
  }
}
