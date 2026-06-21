import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DomainEvents, DeliveryCompletedPayload } from '../../../common/events/domain.events';
import { TenantModuleService } from '../../tenant-module/tenant-module.service';
import { Transaction, TransactionStatus, TransactionType } from '../entities/transaction.entity';

@Injectable()
export class DeliveryFinancialListener {
  constructor(
    @InjectRepository(Transaction)
    private readonly transactionRepository: Repository<Transaction>,
    private readonly tenantModuleService: TenantModuleService,
  ) {}

  @OnEvent(DomainEvents.DELIVERY_COMPLETED)
  async handleDeliveryCompleted(payload: DeliveryCompletedPayload): Promise<void> {
    if (!payload.orderId || payload.amount == null) {
      return;
    }

    const isFinancialActive = await this.tenantModuleService.isModuleEnabled(
      payload.tenantId,
      'financial',
    );

    if (!isFinancialActive) {
      return;
    }

    const transaction = this.transactionRepository.create({
      orderId: payload.orderId,
      tenantId: payload.tenantId,
      type: TransactionType.CREDIT,
      amount: payload.amount,
      status: TransactionStatus.PENDING,
      description: `Receita Ref Pedido ${payload.orderNumber ?? payload.orderId}`,
      organizationId: payload.organizationId,
    });

    await this.transactionRepository.save(transaction);
  }
}
