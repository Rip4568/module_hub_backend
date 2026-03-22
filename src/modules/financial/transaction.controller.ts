import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { TransactionService } from './transaction.service';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { ModuleGuard } from '../../common/guards/module.guard';
import { PermissionGuard } from '../../common/guards/permission.guard';
import { RequiresModule } from '../../common/decorators/requires-module.decorator';
import { RequiresPermission } from '../../common/decorators/requires-permission.decorator';
import { Permissions } from '../../common/constants/permissions';
import { CreateTransactionDto } from './dto/create-transaction.dto';

@Controller('transactions')
@UseGuards(JwtAuthGuard, TenantGuard, ModuleGuard, PermissionGuard)
@RequiresModule('financial')
export class TransactionController {
  constructor(private readonly transactionService: TransactionService) { }

  @Post()
  @RequiresPermission(Permissions.CREATE_PAYMENT)
  create(@CurrentTenant() tenantId: string, @Body() createTransactionDto: CreateTransactionDto) {
    return this.transactionService.create(tenantId, createTransactionDto);
  }

  @Get()
  @RequiresPermission(Permissions.READ_FINANCIAL)
  findAll(@CurrentTenant() tenantId: string) {
    return this.transactionService.findAll(tenantId);
  }

  @Get(':id')
  @RequiresPermission(Permissions.READ_FINANCIAL)
  findOne(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    return this.transactionService.findOne(tenantId, id);
  }

  @Post(':id/approve')
  @RequiresPermission(Permissions.APPROVE_PAYMENT)
  approve(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    return this.transactionService.approve(tenantId, id);
  }

  @Post(':id/cancel')
  @RequiresPermission(Permissions.CANCEL_PAYMENT)
  cancel(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    return this.transactionService.cancel(tenantId, id);
  }
}
