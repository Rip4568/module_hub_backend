import { Controller, Get, Post, Body, Param, UseGuards, Patch } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { TenantService } from './tenant.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { PermissionGuard } from '../../common/guards/permission.guard';
import { RequiresPermission } from '../../common/decorators/requires-permission.decorator';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { UpdateTenantConfigDto } from './dto/update-tenant-config.dto';

@ApiTags('Tenants')
@Controller('tenants')
@UseGuards(JwtAuthGuard, TenantGuard, PermissionGuard)
export class TenantController {
  constructor(private readonly tenantService: TenantService) {}

  @Post()
  @RequiresPermission('tenant:create')
  create(@Body() createTenantDto: any, @CurrentTenant() tenantId: string) {
    return this.tenantService.create({ ...createTenantDto, tenantId });
  }

  @Get()
  @RequiresPermission('tenant:read')
  findMyTenant(@CurrentTenant() tenantId: string) {
    return this.tenantService.findMyTenant(tenantId);
  }

  @Get(':id')
  @RequiresPermission('tenant:read')
  findOne(@Param('id') id: string, @CurrentTenant() tenantId: string) {
    return this.tenantService.findOne(id, tenantId);
  }

  @Patch(':id')
  @RequiresPermission('tenant:update')
  updateConfig(
    @Param('id') id: string,
    @CurrentTenant() tenantId: string,
    @Body() updateDto: UpdateTenantConfigDto,
  ) {
    return this.tenantService.updateConfig(id, tenantId, updateDto);
  }
}
