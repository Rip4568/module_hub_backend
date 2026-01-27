import { Controller, Get, Post, Param, UseGuards } from '@nestjs/common';
import { TenantModuleService } from './tenant-module.service';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';

@Controller('tenant-modules')
@UseGuards(JwtAuthGuard, TenantGuard)
export class TenantModuleController {
    constructor(private readonly tenantModuleService: TenantModuleService) { }

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
