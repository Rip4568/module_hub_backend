import { Controller, Get, UseGuards } from '@nestjs/common';
import { ActivityLogService } from './activity-log.service';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';

@Controller('activity-logs')
@UseGuards(JwtAuthGuard, TenantGuard)
export class ActivityLogController {
  constructor(private readonly activityLogService: ActivityLogService) {}

  @Get()
  findAll(@CurrentTenant() tenantId: string) {
    return this.activityLogService.findAll(tenantId);
  }
}
