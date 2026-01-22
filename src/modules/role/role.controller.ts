import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { RoleService } from './role.service';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { ModuleGuard } from '../../common/guards/module.guard';
import { PermissionGuard } from '../../common/guards/permission.guard';
import { RequiresModule } from '../../common/decorators/requires-module.decorator';
import { RequiresPermission } from '../../common/decorators/requires-permission.decorator';

@Controller('roles')
@UseGuards(JwtAuthGuard, TenantGuard, ModuleGuard, PermissionGuard)
@RequiresModule('team_permissions')
export class RoleController {
  constructor(private readonly roleService: RoleService) {}

  @Post()
  @RequiresPermission('can_manage_roles')
  create(@CurrentTenant() tenantId: string, @Body() createRoleDto: any) {
    return this.roleService.create(tenantId, createRoleDto);
  }

  @Get()
  @RequiresPermission('can_manage_roles')
  findAll(@CurrentTenant() tenantId: string) {
    return this.roleService.findAll(tenantId);
  }

  @Get(':id')
  @RequiresPermission('can_manage_roles')
  findOne(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    return this.roleService.findOne(tenantId, id);
  }

  @Put(':id')
  @RequiresPermission('can_manage_roles')
  update(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
    @Body() updateRoleDto: any,
  ) {
    return this.roleService.update(tenantId, id, updateRoleDto);
  }

  @Delete(':id')
  @RequiresPermission('can_manage_roles')
  remove(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    return this.roleService.remove(tenantId, id);
  }

  @Post(':id/permissions')
  @RequiresPermission('can_manage_permissions')
  addPermissions(@CurrentTenant() tenantId: string, @Param('id') id: string, @Body() body: { permissions: string[] }) {
      return this.roleService.addPermissions(tenantId, id, body.permissions);
  }

  @Delete(':id/permissions')
  @RequiresPermission('can_manage_permissions')
  removePermissions(@CurrentTenant() tenantId: string, @Param('id') id: string, @Body() body: { permissions: string[] }) {
      return this.roleService.removePermissions(tenantId, id, body.permissions);
  }
}
