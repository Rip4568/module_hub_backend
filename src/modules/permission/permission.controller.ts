import { Controller, Get, UseGuards } from '@nestjs/common';
import { PermissionService } from './permission.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { PermissionGuard } from '../../common/guards/permission.guard';
import { RequiresPermission } from '../../common/decorators/requires-permission.decorator';
import { Permissions } from '../../common/constants/permissions';

@Controller('permissions')
@UseGuards(JwtAuthGuard, TenantGuard, PermissionGuard)
export class PermissionController {
  constructor(private readonly permissionService: PermissionService) {}

  @Get()
  @RequiresPermission(Permissions.MANAGE_PERMISSIONS)
  findAll() {
    return this.permissionService.findAll();
  }
}
