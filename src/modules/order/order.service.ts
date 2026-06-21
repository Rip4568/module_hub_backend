import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, In } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ModuleRef } from '@nestjs/core';
import { Order, OrderStatus } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { Product } from '../product/entities/product.entity';
import { ProductVariant } from '../product/entities/product-variant.entity';
import { CreateOrderDto, UpdateOrderDto } from './dto/create-order.dto';
import { ClsService } from 'nestjs-cls';
import { RequestContext } from '../../common/context/request.context';
import { Delivery, DeliveryStatus } from '../delivery/entities/delivery.entity';
import { StockLocationType } from '../product/entities/stock-level.entity';
import { PaginatedResult } from '../../common/interfaces/paginated-result.interface';
import { TenantModuleService } from '../tenant-module/tenant-module.service';
import { ActivityLogService } from '../activity-log/activity-log.service';
import { DomainEvents, OrderCreatedPayload, OrderStockDeductPayload } from '../../common/events/domain.events';

interface InlineCustomer {
  email?: string;
  name?: string;
  phone?: string;
  document?: string;
}

@Injectable()
export class OrderService {
  constructor(
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
    @InjectRepository(OrderItem)
    private orderItemRepository: Repository<OrderItem>,
    @InjectRepository(Delivery)
    private deliveryRepository: Repository<Delivery>,
    private dataSource: DataSource,
    private readonly cls: ClsService,
    private readonly eventEmitter: EventEmitter2,
    private readonly moduleRef: ModuleRef,
    private readonly tenantModuleService: TenantModuleService,
    private readonly activityLogService: ActivityLogService,
  ) { }

  private async resolveCustomer(
    tenantId: string,
    customer?: InlineCustomer,
  ): Promise<{
    customerId?: string;
    customerName?: string;
    customerEmail?: string;
    customerPhone?: string;
    customerDocument?: string;
  }> {
    if (!customer) {
      return {};
    }

    const isEcommerceActive = await this.tenantModuleService.isModuleEnabled(tenantId, 'ecommerce');

    if (isEcommerceActive) {
      try {
        const { CustomerService } = await import('../customer/customer.service');
        const customerService = this.moduleRef.get(CustomerService, { strict: false });

        if (customerService && customer.email && customer.name) {
          const savedCustomer = await customerService.getOrCreate(tenantId, {
            email: customer.email,
            name: customer.name,
            phone: customer.phone,
            document: customer.document,
          });

          return {
            customerId: savedCustomer.id,
            customerName: savedCustomer.name,
            customerEmail: savedCustomer.email,
            customerPhone: savedCustomer.phone,
            customerDocument: savedCustomer.document,
          };
        }
      } catch {
        // Customer module not loaded — fall through to inline data
      }
    }

    return {
      customerName: customer.name,
      customerEmail: customer.email,
      customerPhone: customer.phone,
      customerDocument: customer.document,
    };
  }

  async create(createOrderDto: CreateOrderDto & { tenantId: string }): Promise<Order> {
    const userId = this.cls.get(RequestContext.USER_ID);
    const { items, ...orderData } = createOrderDto;

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const order = this.orderRepository.create({
        ...orderData,
        createdById: userId,
        status: OrderStatus.PENDING,
        orderNumber: `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`
      } as Order);

      const locationType = orderData.vehicleId ? StockLocationType.VEHICLE : StockLocationType.WAREHOUSE;
      const locationId = orderData.vehicleId;

      const savedOrder = await queryRunner.manager.save(order);

      if (items && items.length > 0) {
        let total = 0;
        const orderItems = [];

        const productIds = items.map(i => i.productId);
        const variantIds = items.filter(i => i.variantId).map(i => i.variantId!);

        const products = await queryRunner.manager.find(Product, { where: { id: In(productIds) } });
        const variants = variantIds.length > 0
          ? await queryRunner.manager.find(ProductVariant, { where: { id: In(variantIds) } })
          : [];

        const productMap = new Map(products.map(p => [p.id, p]));
        const variantMap = new Map(variants.map(v => [v.id, v]));

        const stockItems: OrderStockDeductPayload['items'] = [];

        for (const item of items) {
          const product = productMap.get(item.productId);
          if (!product) throw new NotFoundException(`Product ${item.productId} not found`);

          let unitPrice = Number(product.price);

          if (item.variantId) {
            const variant = variantMap.get(item.variantId);
            if (!variant) throw new NotFoundException(`Variant ${item.variantId} not found`);
            unitPrice = variant.price ? Number(variant.price) : unitPrice;
          }

          stockItems.push({
            productId: item.productId,
            variantId: item.variantId,
            quantity: item.quantity,
          });

          const subtotal = unitPrice * item.quantity;
          total += subtotal;

          const orderItem = this.orderItemRepository.create({
            orderId: savedOrder.id,
            productId: item.productId,
            variantId: item.variantId,
            name: product.name,
            quantity: item.quantity,
            unitPrice: unitPrice,
            subtotal: subtotal,
            total: subtotal,
          } as OrderItem);
          orderItems.push(orderItem);
        }

        await this.eventEmitter.emitAsync(DomainEvents.ORDER_STOCK_DEDUCT, {
          manager: queryRunner.manager,
          tenantId: createOrderDto.tenantId,
          orderId: savedOrder.id,
          items: stockItems,
          locationType: locationType === StockLocationType.VEHICLE ? 'VEHICLE' : 'WAREHOUSE',
          locationId,
        } satisfies OrderStockDeductPayload);

        await queryRunner.manager.save(OrderItem, orderItems);

        savedOrder.subtotal = total;
        savedOrder.total = total;
        await queryRunner.manager.save(savedOrder);
      }

      await queryRunner.commitTransaction();

      const createdOrder = await this.findOne(savedOrder.id, createOrderDto.tenantId!);

      await this.activityLogService.log({
        tenantId: createOrderDto.tenantId,
        userId,
        action: 'create',
        resource: 'order',
        resourceId: savedOrder.id,
        changes: { orderNumber: savedOrder.orderNumber, status: OrderStatus.PENDING },
      });

      await this.eventEmitter.emitAsync(DomainEvents.ORDER_CREATED, {
        tenantId: createOrderDto.tenantId,
        orderId: savedOrder.id,
        orderNumber: savedOrder.orderNumber,
        userId,
      } satisfies OrderCreatedPayload);

      return createdOrder;

    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async checkout(tenantId: string, checkoutDto: Record<string, unknown>): Promise<Order> {
    const { items, customer, ...orderData } = checkoutDto;
    const customerData = await this.resolveCustomer(tenantId, customer as InlineCustomer | undefined);

    const createOrderDto = {
      ...orderData,
      items,
      ...customerData,
      tenantId,
    };

    return this.cls.run(async () => {
      this.cls.set(RequestContext.TENANT_ID, tenantId);
      return this.create(createOrderDto as CreateOrderDto & { tenantId: string });
    });
  }

  async findAll(tenantId: string, page = 1, limit = 20): Promise<PaginatedResult<Order>> {
    const [data, total] = await this.orderRepository.findAndCount({
      where: { tenantId },
      relations: ['customer', 'driver', 'vehicle', 'items'],
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
    });
    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string, tenantId: string): Promise<Order> {
    const order = await this.orderRepository.findOne({
      where: { id, tenantId },
      relations: ['items', 'createdBy', 'delivery', 'customer', 'driver', 'vehicle'],
    });

    if (!order) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }
    return order;
  }

  async update(id: string, updateOrderDto: UpdateOrderDto & { tenantId: string }): Promise<Order> {
    const { tenantId, ...dto } = updateOrderDto;
    const order = await this.findOne(id, tenantId);
    this.orderRepository.merge(order, dto as Partial<Order>);
    return this.orderRepository.save(order);
  }

  async cancel(id: string, reason: string, tenantId: string): Promise<Order> {
    const order = await this.findOne(id, tenantId);
    order.status = OrderStatus.CANCELLED;
    order.cancelReason = reason;
    order.cancelledAt = new Date();
    return this.orderRepository.save(order);
  }

  async approve(id: string, tenantId: string): Promise<Order> {
    const order = await this.findOne(id, tenantId);
    order.status = OrderStatus.ACCEPTED;
    order.acceptedAt = new Date();
    return this.orderRepository.save(order);
  }

  async assignResources(id: string, driverId: string, vehicleId: string | undefined, tenantId: string): Promise<Order> {
    const order = await this.findOne(id, tenantId);
    order.driverId = driverId;
    if (vehicleId) order.vehicleId = vehicleId;

    order.status = OrderStatus.ASSIGNED;
    order.assignedAt = new Date();
    return this.orderRepository.save(order);
  }

  async complete(id: string, tenantId: string): Promise<Order> {
    const order = await this.findOne(id, tenantId);
    order.status = OrderStatus.COMPLETED;
    order.completedAt = new Date();
    return this.orderRepository.save(order);
  }

  async dispatch(id: string, tenantId: string): Promise<Order> {
    const order = await this.findOne(id, tenantId);
    if (order.status !== OrderStatus.ACCEPTED && order.status !== OrderStatus.ASSIGNED) {
      throw new BadRequestException(`Cannot dispatch order in status ${order.status}`);
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      order.status = OrderStatus.IN_ROUTE;
      order.inRouteAt = new Date();
      const savedOrder = await queryRunner.manager.save(order);

      const delivery = this.deliveryRepository.create({
        orderId: savedOrder.id,
        tenantId: savedOrder.tenantId,
        driverId: savedOrder.driverId,
        vehicleId: savedOrder.vehicleId,
        destinationAddress: savedOrder.shippingAddress,
        status: DeliveryStatus.PENDING,
      });
      await queryRunner.manager.save(delivery);

      await queryRunner.commitTransaction();
      return savedOrder;
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }
}
