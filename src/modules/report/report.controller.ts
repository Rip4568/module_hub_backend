import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ReportService } from './report.service';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { ModuleGuard } from '../../common/guards/module.guard';
import { PermissionGuard } from '../../common/guards/permission.guard';
import { RequiresModule } from '../../common/decorators/requires-module.decorator';
import { RequiresPermission } from '../../common/decorators/requires-permission.decorator';

@Controller('reports')
@UseGuards(JwtAuthGuard, TenantGuard, ModuleGuard, PermissionGuard)
@RequiresModule('advanced_reports')
export class ReportController {
  constructor(private readonly reportService: ReportService) {}

  @Get('sales')
  @RequiresPermission('can_read_report')
  async getSalesReport(
      @CurrentTenant() tenantId: string,
      @Query('startDate') startDate: string,
      @Query('endDate') endDate: string
  ) {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;
    return this.reportService.getSalesReport(tenantId, start, end);
  }

  @Get('fleet')
  @RequiresPermission('can_read_report')
  async getFleetStatus(@CurrentTenant() tenantId: string) {
    return this.reportService.getFleetStatus(tenantId);
  }
}
