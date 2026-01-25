import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, In } from 'typeorm';
import { Order, OrderStatus } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { Product } from '../product/entities/product.entity';
import { ProductVariant } from '../product/entities/product-variant.entity';
import { CreateOrderDto, UpdateOrderDto } from './dto/create-order.dto';

@Injectable()
export class OrderService {
  constructor(
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
    @InjectRepository(OrderItem)
    private orderItemRepository: Repository<OrderItem>,
    private dataSource: DataSource,
  ) { }

  async create(tenantId: string, userId: string, createOrderDto: CreateOrderDto): Promise<Order> {
    const { items, ...orderData } = createOrderDto;

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1. Create Order
      const order = this.orderRepository.create({
        ...orderData,
        tenantId,
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
      return this.findOne(tenantId, savedOrder.id);

    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async findAll(tenantId: string): Promise<Order[]> {
    return this.orderRepository.find({ where: { tenantId } });
  }

  async findOne(tenantId: string, id: string): Promise<Order> {
    const order = await this.orderRepository.findOne({
      where: { id, tenantId },
      relations: ['items', 'createdBy', 'delivery'],
    });

    if (!order) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }
    return order;
  }

  async update(tenantId: string, id: string, updateOrderDto: UpdateOrderDto): Promise<Order> {
    const order = await this.findOne(tenantId, id);
    this.orderRepository.merge(order, updateOrderDto as any);
    return this.orderRepository.save(order);
  }

  async cancel(tenantId: string, id: string, reason: string): Promise<Order> {
    const order = await this.findOne(tenantId, id);
    order.status = OrderStatus.CANCELLED;
    order.cancelReason = reason;
    order.cancelledAt = new Date();
    return this.orderRepository.save(order);
  }

  async approve(tenantId: string, id: string): Promise<Order> {
    const order = await this.findOne(tenantId, id);
    order.status = OrderStatus.ACCEPTED;
    order.acceptedAt = new Date();
    return this.orderRepository.save(order);
  }

  async assignDriver(tenantId: string, id: string, driverId: string): Promise<Order> {
    const order = await this.findOne(tenantId, id);
    order.driverId = driverId;
    order.status = OrderStatus.ASSIGNED;
    order.assignedAt = new Date();
    return this.orderRepository.save(order);
  }

  async complete(tenantId: string, id: string): Promise<Order> {
    const order = await this.findOne(tenantId, id);
    order.status = OrderStatus.COMPLETED;
    order.completedAt = new Date();
    return this.orderRepository.save(order);
  }
}
