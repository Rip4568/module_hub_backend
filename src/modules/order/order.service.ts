import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Order, OrderStatus } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { Product } from '../product/entities/product.entity';
import { ProductVariant } from '../product/entities/product-variant.entity';
import { User } from '../user/entities/user.entity';

@Injectable()
export class OrderService {
  constructor(
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
    @InjectRepository(OrderItem)
    private orderItemRepository: Repository<OrderItem>,
    private dataSource: DataSource,
  ) {}

  async create(tenantId: string, userId: string, createOrderDto: any): Promise<Order> {
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
        // Simple generation of orderNumber for MVP. In prod use sequence or better generator
        orderNumber: `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`
      } as Order);
      const savedOrder = await queryRunner.manager.save(order);

      // 2. Process Items & Update Stock
      if (items && items.length > 0) {
        let total = 0;
        const orderItems = [];

        for (const item of items) {
          // Check product/variant existence and stock
          // This should ideally be optimized to fetch all at once
          const product = await queryRunner.manager.findOne(Product, { where: { id: item.productId } });
          let unitPrice = product ? Number(product.price) : 0;

          if (item.variantId) {
             const variant = await queryRunner.manager.findOne(ProductVariant, { where: { id: item.variantId } });
             if (variant) {
                 unitPrice = variant.price ? Number(variant.price) : unitPrice;
                 if (variant.stock < item.quantity) {
                     throw new Error(`Insufficient stock for variant ${variant.name}`);
                 }
                 variant.stock -= item.quantity;
                 await queryRunner.manager.save(variant);
             }
          } else if (product) {
              if (product.trackInventory && product.stock < item.quantity) {
                  throw new Error(`Insufficient stock for product ${product.name}`);
              }
              if (product.trackInventory) {
                  product.stock -= item.quantity;
                  await queryRunner.manager.save(product);
              }
          }

          const subtotal = unitPrice * item.quantity;
          total += subtotal; // Ignoring discount/tax logic for brevity in this snippet

          const orderItem = this.orderItemRepository.create({
            orderId: savedOrder.id,
            productId: item.productId,
            variantId: item.variantId,
            name: product ? product.name : 'Unknown Item', // Snapshot name
            quantity: item.quantity,
            unitPrice: unitPrice,
            subtotal: subtotal,
            total: subtotal,
          } as OrderItem);
          orderItems.push(orderItem);
        }

        await queryRunner.manager.save(OrderItem, orderItems);

        // Update total
        savedOrder.subtotal = total;
        savedOrder.total = total; // + tax + shipping - discount
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

  async update(tenantId: string, id: string, updateOrderDto: any): Promise<Order> {
    const order = await this.findOne(tenantId, id);
    this.orderRepository.merge(order, updateOrderDto);
    return this.orderRepository.save(order);
  }

  async cancel(tenantId: string, id: string, reason: string): Promise<Order> {
      const order = await this.findOne(tenantId, id);
      // Logic to restore stock should be here (similar to create transaction but reversed)
      // Skipped for MVP brevity
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
