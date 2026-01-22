import { Controller, Get, Post, Body, Param, UseGuards, Delete } from '@nestjs/common';
import { UserService } from './user.service';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { ModuleGuard } from '../../common/guards/module.guard';
import { PermissionGuard } from '../../common/guards/permission.guard';
import { RequiresModule } from '../../common/decorators/requires-module.decorator';
import { RequiresPermission } from '../../common/decorators/requires-permission.decorator';

@Controller('users')
@UseGuards(JwtAuthGuard, TenantGuard, ModuleGuard, PermissionGuard)
@RequiresModule('user_management')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  @RequiresPermission('can_create_user')
  create(@Body() createUserDto: any) {
    return this.userService.create(createUserDto);
  }

  @Get(':id')
  @RequiresPermission('can_read_user')
  findOne(@Param('id') id: string) {
    return this.userService.findOne(id);
  }

  @Post(':id/roles/:roleId')
  @RequiresPermission('can_manage_roles')
  addRole(@Param('id') id: string, @Param('roleId') roleId: string) {
      return this.userService.addRole(id, roleId);
  }

  @Delete(':id/roles/:roleId')
  @RequiresPermission('can_manage_roles')
  removeRole(@Param('id') id: string, @Param('roleId') roleId: string) {
      return this.userService.removeRole(id, roleId);
  }

  @Post(':id/permissions/grant')
  @RequiresPermission('can_manage_permissions')
  grantPermission(@Param('id') id: string, @Body() body: { permission: string }) {
      return this.userService.grantPermission(id, body.permission);
  }

  @Post(':id/permissions/revoke')
  @RequiresPermission('can_manage_permissions')
  revokePermission(@Param('id') id: string, @Body() body: { permission: string }) {
      return this.userService.revokePermission(id, body.permission);
  }
}
