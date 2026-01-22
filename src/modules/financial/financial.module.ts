import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BankAccount } from './entities/bank-account.entity';
import { Transaction } from './entities/transaction.entity';
import { BankAccountService } from './bank-account.service';
import { BankAccountController } from './bank-account.controller';
import { TransactionService } from './transaction.service';
import { TransactionController } from './transaction.controller';
import { TenantModuleModule } from '../tenant-module/tenant-module.module';
import { PermissionModule } from '../permission/permission.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([BankAccount, Transaction]),
    TenantModuleModule,
    PermissionModule
  ],
  controllers: [BankAccountController, TransactionController],
  providers: [BankAccountService, TransactionService],
  exports: [BankAccountService, TransactionService],
})
export class FinancialModule {}
