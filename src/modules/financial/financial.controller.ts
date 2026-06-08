import { Controller, Get, UseGuards } from '@nestjs/common';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { ModuleGuard } from '../../common/guards/module.guard';
import { PermissionGuard } from '../../common/guards/permission.guard';
import { RequiresModule } from '../../common/decorators/requires-module.decorator';
import { RequiresPermission } from '../../common/decorators/requires-permission.decorator';
import { Permissions } from '../../common/constants/permissions';
import { TransactionService } from './transaction.service';

@Controller('financial')
@UseGuards(JwtAuthGuard, TenantGuard, ModuleGuard, PermissionGuard)
@RequiresModule('financial')
export class FinancialController {
  constructor(private readonly transactionService: TransactionService) {}

  @Get('kpis')
  @RequiresPermission(Permissions.READ_FINANCIAL)
  getKPIs(@CurrentTenant() tenantId: string) {
    return this.transactionService.getKPIs(tenantId);
  }
}
