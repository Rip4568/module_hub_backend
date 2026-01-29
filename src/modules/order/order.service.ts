import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, In } from 'typeorm';
import { Order, OrderStatus } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { Product } from '../product/entities/product.entity';
import { ProductVariant } from '../product/entities/product-variant.entity';
import { InventoryLog, InventoryLogType } from '../product/entities/inventory-log.entity';
import { CreateOrderDto, UpdateOrderDto } from './dto/create-order.dto';
import { ClsService } from 'nestjs-cls';
import { RequestContext } from '../../common/context/request.context';
import { Delivery, DeliveryStatus } from '../delivery/entities/delivery.entity';
import { CustomerService } from '../customer/customer.service';

@Injectable()
export class OrderService {
  constructor(
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
    @InjectRepository(OrderItem)
    private orderItemRepository: Repository<OrderItem>,
    @InjectRepository(InventoryLog)
    private inventoryLogRepository: Repository<InventoryLog>,
    @InjectRepository(Delivery)
    private deliveryRepository: Repository<Delivery>,
    private customerService: CustomerService,
    private dataSource: DataSource,
    private readonly cls: ClsService,
  ) { }

  async create(createOrderDto: CreateOrderDto): Promise<Order> {
    const userId = this.cls.get(RequestContext.USER_ID);
    const { items, ...orderData } = createOrderDto;

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1. Create Order
      const order = this.orderRepository.create({
        ...orderData,
        createdById: userId,
        status: OrderStatus.PENDING,
        orderNumber: `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`
      } as Order);
      const savedOrder = await queryRunner.manager.save(order);

      // 2. Process Items & Update Stock (Optimized)
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

        for (const item of items) {
          const product = productMap.get(item.productId);
          if (!product) throw new NotFoundException(`Product ${item.productId} not found`);

          let unitPrice = Number(product.price);

          if (item.variantId) {
            const variant = variantMap.get(item.variantId);
            if (!variant) throw new NotFoundException(`Variant ${item.variantId} not found`);

            unitPrice = variant.price ? Number(variant.price) : unitPrice;
            if (variant.stock < item.quantity) {
              throw new Error(`Insufficient stock for variant ${variant.name}`);
            }
            variant.stock -= item.quantity;
            await queryRunner.manager.save(variant);
          } else {
            if (product.trackInventory && product.stock < item.quantity) {
              throw new Error(`Insufficient stock for product ${product.name}`);
            }
            if (product.trackInventory) {
              product.stock -= item.quantity;
              await queryRunner.manager.save(product);
            }
          }

          // 3. Record in InventoryLog (Kardex)
          const inventoryLog = this.inventoryLogRepository.create({
            productId: item.productId,
            variantId: item.variantId,
            type: InventoryLogType.SALE,
            quantity: item.quantity,
            referenceId: savedOrder.id,
            notes: `Venda Ref Pedido ${savedOrder.orderNumber}`,
          });
          await queryRunner.manager.save(inventoryLog);

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

        await queryRunner.manager.save(OrderItem, orderItems);

        savedOrder.subtotal = total;
        savedOrder.total = total;
        await queryRunner.manager.save(savedOrder);
      }

      await queryRunner.commitTransaction();
      return this.findOne(savedOrder.id);

    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async checkout(tenantId: string, checkoutDto: any): Promise<Order> {
    const { items, customer, ...orderData } = checkoutDto;

    // 1. Get or Create Customer
    const savedCustomer = await this.customerService.getOrCreate(tenantId, customer);

    // 2. Map to CreateOrderDto structure and call internal create
    const createOrderDto = {
      ...orderData,
      items,
      customerName: savedCustomer.name,
      customerEmail: savedCustomer.email,
      customerPhone: savedCustomer.phone,
      customerDocument: savedCustomer.document,
      customerId: savedCustomer.id,
      tenantId: tenantId,
    };

    // Need to temporarily set tenantId in CLS if not present
    return this.cls.run(async () => {
      this.cls.set(RequestContext.TENANT_ID, tenantId);
      return this.create(createOrderDto);
    });
  }

  async findAll(): Promise<Order[]> {
    return this.orderRepository.find({
      relations: ['customer', 'driver', 'vehicle', 'items'],
      order: { createdAt: 'DESC' }
    });
  }

  async findOne(id: string): Promise<Order> {
    const order = await this.orderRepository.findOne({
      where: { id } as any,
      relations: ['items', 'createdBy', 'delivery', 'customer', 'driver', 'vehicle'],
    });

    if (!order) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }
    return order;
  }

  // ... update, cancel, approve methods remain same ...

  async update(id: string, updateOrderDto: UpdateOrderDto): Promise<Order> {
    const order = await this.findOne(id);
    this.orderRepository.merge(order, updateOrderDto as any);
    return this.orderRepository.save(order);
  }

  async cancel(id: string, reason: string): Promise<Order> {
    const order = await this.findOne(id);
    order.status = OrderStatus.CANCELLED;
    order.cancelReason = reason;
    order.cancelledAt = new Date();
    return this.orderRepository.save(order);
  }

  async approve(id: string): Promise<Order> {
    const order = await this.findOne(id);
    order.status = OrderStatus.ACCEPTED;
    order.acceptedAt = new Date();
    return this.orderRepository.save(order);
  }

  async assignResources(id: string, driverId: string, vehicleId?: string): Promise<Order> {
    const order = await this.findOne(id);
    order.driverId = driverId;
    if (vehicleId) order.vehicleId = vehicleId;

    order.status = OrderStatus.ASSIGNED;
    order.assignedAt = new Date();
    return this.orderRepository.save(order);
  }

  async complete(id: string): Promise<Order> {
    const order = await this.findOne(id);
    order.status = OrderStatus.COMPLETED;
    order.completedAt = new Date();
    return this.orderRepository.save(order);
  }

  async dispatch(id: string): Promise<Order> {
    const order = await this.findOne(id);
    if (order.status !== OrderStatus.ACCEPTED && order.status !== OrderStatus.ASSIGNED) {
      throw new Error(`Cannot dispatch order in status ${order.status}`);
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      order.status = OrderStatus.IN_ROUTE;
      order.inRouteAt = new Date();
      const savedOrder = await queryRunner.manager.save(order);

      // Create Delivery
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
