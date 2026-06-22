import {
  Controller,
  Get,
  UseGuards,
  Request,
  Query,
  Res,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { Response } from 'express';
import { DriverPortalService } from './driver-portal.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { AuthenticatedRequest } from '../../common/interfaces/authenticated-request.interface';
// import { TenantGuard } from '../../common/guards/tenant.guard'; // Not using TenantGuard globally here because 'my-tenants' doesn't need a specific tenant context

@Controller('driver-portal')
@UseGuards(JwtAuthGuard)
export class DriverPortalController {
  constructor(private readonly driverPortalService: DriverPortalService) {}

  /**
   * Global endpoint: Find all companies where I am a driver
   * Does NOT require x-tenant-id header
   */
  @Get('my-tenants')
  async getMyTenants(@Request() req: AuthenticatedRequest) {
    if (!req.user?.userId) throw new UnauthorizedException('User ID missing');
    return this.driverPortalService.getMyTenants(req.user.userId);
  }

  /**
   * Context-specific endpoint: Get my profile in the current tenant
   * Requires x-tenant-id (handled manually or via interceptor if we added TenantGuard locally)
   */
  @Get('me')
  async getMe(@Request() req: AuthenticatedRequest) {
    // Manual extraction if TenantGuard is not on class level, or use CurrentTenant if possible.
    // Ideally we rely on the header being passed by key
    const tenantIdHeader = req.headers['x-tenant-id'];
    const tenantId = Array.isArray(tenantIdHeader) ? tenantIdHeader[0] : tenantIdHeader;

    if (!tenantId) {
      throw new BadRequestException(
        'Tenant ID header (x-tenant-id) is required for this operation',
      );
    }
    if (!req.user?.userId) throw new UnauthorizedException('User ID missing');

    return this.driverPortalService.getProfile(tenantId, req.user.userId);
  }

  /**
   * Export Driver Data (CSV/XLSX)
   * Even blocked drivers can access this to retrieve their history.
   */
  @Get('export')
  async exportData(
    @Request() req: AuthenticatedRequest,
    @Query('format') format: 'xlsx' | 'csv' = 'xlsx',
    @Res() res: Response,
  ) {
    const tenantIdHeader = req.headers['x-tenant-id'];
    const tenantId = Array.isArray(tenantIdHeader) ? tenantIdHeader[0] : tenantIdHeader;
    if (!tenantId) throw new BadRequestException('Tenant ID required');
    if (!req.user?.userId) throw new UnauthorizedException('User ID missing');

    const buffer = await this.driverPortalService.exportData(tenantId, req.user.userId, format);

    res.set({
      'Content-Type':
        format === 'csv'
          ? 'text/csv'
          : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename=driver_data.${format}`,
      'Content-Length': buffer.length,
    });

    res.end(buffer);
  }
}
