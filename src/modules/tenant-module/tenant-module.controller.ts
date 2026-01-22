import { Controller, Get, Post, Body, Param, UseGuards, Delete } from '@nestjs/common';
import { TenantModuleService } from './tenant-module.service';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
// Only admins should manage modules usually
// Assuming check handled by specific permission or role check on frontend/middleware,
// here we can add permission check if needed 'can_manage_tenant'

@Controller('tenant-modules')
@UseGuards(JwtAuthGuard, TenantGuard)
export class TenantModuleController {
  constructor(private readonly tenantModuleService: TenantModuleService) {}

  @Get()
  findAll(@CurrentTenant() tenantId: string) {
      return this.tenantModuleService.findAll(tenantId);
  }

  @Post(':moduleId/activate')
  activate(@CurrentTenant() tenantId: string, @Param('moduleId') moduleId: string) {
      return this.tenantModuleService.activateModule(tenantId, moduleId);
  }

  @Post(':moduleId/deactivate')
  deactivate(@CurrentTenant() tenantId: string, @Param('moduleId') moduleId: string) {
      return this.tenantModuleService.deactivateModule(tenantId, moduleId);
  }
}
