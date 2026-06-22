import { Controller, Get, Post, Body, Param, UseGuards, Query } from '@nestjs/common';
import { BankAccountService } from './bank-account.service';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { ModuleGuard } from '../../common/guards/module.guard';
import { PermissionGuard } from '../../common/guards/permission.guard';
import { RequiresModule } from '../../common/decorators/requires-module.decorator';
import { RequiresPermission } from '../../common/decorators/requires-permission.decorator';
import { Permissions } from '../../common/constants/permissions';

@Controller('bank-accounts')
@UseGuards(JwtAuthGuard, TenantGuard, ModuleGuard, PermissionGuard)
@RequiresModule('financial')
export class BankAccountController {
  constructor(private readonly bankAccountService: BankAccountService) {}

  @Post()
  @RequiresPermission(Permissions.CREATE_PAYMENT) // Loose mapping for bank account setup
  create(@Body() createAccountDto: any, @CurrentTenant() tenantId: string) {
    return this.bankAccountService.create({ ...createAccountDto, tenantId });
  }

  @Get()
  @RequiresPermission(Permissions.READ_FINANCIAL)
  findAll(
    @CurrentTenant() tenantId: string,
    @Query('organizationId') organizationId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.bankAccountService.findAll(organizationId, tenantId, page, limit);
  }
}
