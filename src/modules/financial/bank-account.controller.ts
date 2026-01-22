import { Controller, Get, Post, Body, Param, UseGuards, Query } from '@nestjs/common';
import { BankAccountService } from './bank-account.service';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { ModuleGuard } from '../../common/guards/module.guard';
import { PermissionGuard } from '../../common/guards/permission.guard';
import { RequiresModule } from '../../common/decorators/requires-module.decorator';
import { RequiresPermission } from '../../common/decorators/requires-permission.decorator';

@Controller('bank-accounts')
@UseGuards(JwtAuthGuard, TenantGuard, ModuleGuard, PermissionGuard)
@RequiresModule('financial')
export class BankAccountController {
  constructor(private readonly bankAccountService: BankAccountService) {}

  @Post()
  @RequiresPermission('can_create_payment') // Loose mapping for bank account setup
  create(@Body() createAccountDto: any) {
    return this.bankAccountService.create(createAccountDto);
  }

  @Get()
  @RequiresPermission('can_read_financial')
  findAll(@Query('organizationId') organizationId: string) {
    return this.bankAccountService.findAll(organizationId);
  }
}
