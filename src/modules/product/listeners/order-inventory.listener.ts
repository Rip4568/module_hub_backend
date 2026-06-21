import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import {
  DomainEvents,
  OrderStockDeductPayload,
} from '../../../common/events/domain.events';
import { InventoryService } from '../inventory.service';
import { StockLocationType } from '../entities/stock-level.entity';
import { TenantModuleService } from '../../tenant-module/tenant-module.service';

@Injectable()
export class OrderInventoryListener {
  constructor(
    private readonly inventoryService: InventoryService,
    private readonly tenantModuleService: TenantModuleService,
  ) {}

  @OnEvent(DomainEvents.ORDER_STOCK_DEDUCT)
  async handleStockDeduct(payload: OrderStockDeductPayload): Promise<void> {
    const isInventoryActive = await this.tenantModuleService.isModuleEnabled(
      payload.tenantId,
      'inventory',
    );

    if (!isInventoryActive) {
      return;
    }

    const locationType =
      payload.locationType === 'VEHICLE'
        ? StockLocationType.VEHICLE
        : StockLocationType.WAREHOUSE;

    for (const item of payload.items) {
      await this.inventoryService.deductStockForOrder(
        payload.manager,
        item.productId,
        item.variantId || null,
        item.quantity,
        locationType,
        payload.locationId,
        payload.orderId,
      );
    }
  }
}
