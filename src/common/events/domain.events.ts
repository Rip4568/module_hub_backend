import { EntityManager } from 'typeorm';

export const DomainEvents = {
  ORDER_STOCK_DEDUCT: 'order.stock.deduct',
  ORDER_CREATED: 'order.created',
  DELIVERY_COMPLETED: 'delivery.completed',
  MODULE_ACTIVATED: 'module.activated',
} as const;

export interface OrderStockDeductPayload {
  manager: EntityManager;
  tenantId: string;
  orderId: string;
  items: Array<{ productId: string; variantId?: string; quantity: number }>;
  locationType: 'WAREHOUSE' | 'VEHICLE';
  locationId?: string;
}

export interface OrderCreatedPayload {
  tenantId: string;
  orderId: string;
  orderNumber: string;
  userId?: string;
}

export interface DeliveryCompletedPayload {
  tenantId: string;
  deliveryId: string;
  orderId?: string;
  userId?: string;
}

export interface ModuleActivatedPayload {
  tenantId: string;
  moduleId: string;
  userId?: string;
}
