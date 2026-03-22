import { Controller, Get, Post, Body, Param, UseGuards, Delete, Patch } from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { ModuleGuard } from '../../common/guards/module.guard';
import { PermissionGuard } from '../../common/guards/permission.guard';
import { RequiresModule } from '../../common/decorators/requires-module.decorator';
import { RequiresPermission } from '../../common/decorators/requires-permission.decorator';
import { Permissions } from '../../common/constants/permissions';

@Controller('users')
@UseGuards(JwtAuthGuard, TenantGuard, ModuleGuard, PermissionGuard)
@RequiresModule('user') // Core module, always enabled
export class UserController {
  constructor(private readonly userService: UserService) { }

  @Post()
  @RequiresPermission(Permissions.CREATE_USER)
  create(@CurrentTenant() tenantId: string, @Body() createUserDto: CreateUserDto) {
    return this.userService.create({
      ...createUserDto,
      tenantId,
    });
  }

  @Get()
  @RequiresPermission(Permissions.READ_USER)
  findAll(@CurrentTenant() tenantId: string) {
    return this.userService.findAllByTenant(tenantId);
  }

  @Get(':id')
  @RequiresPermission(Permissions.READ_USER)
  findOne(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    return this.userService.findOneByTenant(id, tenantId);
  }

  @Patch(':id')
  @RequiresPermission(Permissions.UPDATE_USER)
  update(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.userService.updateByTenant(id, tenantId, updateUserDto);
  }

  @Delete(':id')
  @RequiresPermission(Permissions.DELETE_USER)
  async remove(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    await this.userService.removeByTenant(id, tenantId);
    return { deleted: true };
  }

  @Post(':id/roles/:roleId')
  @RequiresPermission(Permissions.MANAGE_ROLES)
  addRole(@Param('id') id: string, @Param('roleId') roleId: string) {
    return this.userService.addRole(id, roleId);
  }

  @Delete(':id/roles/:roleId')
  @RequiresPermission(Permissions.MANAGE_ROLES)
  removeRole(@Param('id') id: string, @Param('roleId') roleId: string) {
    return this.userService.removeRole(id, roleId);
  }

  @Post(':id/permissions/grant')
  @RequiresPermission(Permissions.MANAGE_PERMISSIONS)
  grantPermission(@Param('id') id: string, @Body() body: { permission: string }) {
    return this.userService.grantPermission(id, body.permission);
  }

  @Post(':id/permissions/revoke')
  @RequiresPermission(Permissions.MANAGE_PERMISSIONS)
  revokePermission(@Param('id') id: string, @Body() body: { permission: string }) {
    return this.userService.revokePermission(id, body.permission);
  }
}
