import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { TransactionService } from './transaction.service';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { ModuleGuard } from '../../common/guards/module.guard';
import { PermissionGuard } from '../../common/guards/permission.guard';
import { RequiresModule } from '../../common/decorators/requires-module.decorator';
import { RequiresPermission } from '../../common/decorators/requires-permission.decorator';

@Controller('transactions')
@UseGuards(JwtAuthGuard, TenantGuard, ModuleGuard, PermissionGuard)
@RequiresModule('financial')
export class TransactionController {
  constructor(private readonly transactionService: TransactionService) {}

  @Post()
  @RequiresPermission('can_create_payment')
  create(@CurrentTenant() tenantId: string, @Body() createTransactionDto: any) {
    return this.transactionService.create(tenantId, createTransactionDto);
  }

  @Get()
  @RequiresPermission('can_read_financial')
  findAll(@CurrentTenant() tenantId: string) {
    return this.transactionService.findAll(tenantId);
  }

  @Get(':id')
  @RequiresPermission('can_read_financial')
  findOne(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    return this.transactionService.findOne(tenantId, id);
  }

  @Post(':id/approve')
  @RequiresPermission('can_approve_payment')
  approve(@CurrentTenant() tenantId: string, @Param('id') id: string) {
      return this.transactionService.approve(tenantId, id);
  }

  @Post(':id/cancel')
  @RequiresPermission('can_cancel_payment')
  cancel(@CurrentTenant() tenantId: string, @Param('id') id: string) {
      return this.transactionService.cancel(tenantId, id);
  }
}
