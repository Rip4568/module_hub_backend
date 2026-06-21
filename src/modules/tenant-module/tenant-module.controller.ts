import { Controller, Get, Post, Param, UseGuards, Query } from '@nestjs/common';
import { TenantModuleService } from './tenant-module.service';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { ModuleGuard } from '../../common/guards/module.guard';
import { PermissionGuard } from '../../common/guards/permission.guard';
import { RequiresModule } from '../../common/decorators/requires-module.decorator';
import { RequiresPermission } from '../../common/decorators/requires-permission.decorator';
import { Permissions } from '../../common/constants/permissions';

@Controller('tenant-modules')
@UseGuards(JwtAuthGuard, TenantGuard, ModuleGuard, PermissionGuard)
@RequiresModule('tenant-module')
export class TenantModuleController {
  constructor(private readonly tenantModuleService: TenantModuleService) {}

  @Get()
  findAll(@CurrentTenant() tenantId: string, @Query('page') page?: number, @Query('limit') limit?: number) {
    return this.tenantModuleService.findAll(tenantId, page, limit);
  }

  @RequiresPermission(Permissions.MANAGE_MODULES)
  @Post(':moduleId/activate')
  activate(@CurrentTenant() tenantId: string, @Param('moduleId') moduleId: string) {
    return this.tenantModuleService.activateModule(tenantId, moduleId);
  }

  @RequiresPermission(Permissions.MANAGE_MODULES)
  @Post(':moduleId/deactivate')
  deactivate(@CurrentTenant() tenantId: string, @Param('moduleId') moduleId: string) {
    return this.tenantModuleService.deactivateModule(tenantId, moduleId);
  }
}
