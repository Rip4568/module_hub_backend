import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Delivery } from './entities/delivery.entity';
import { Order, OrderStatus } from '../order/entities/order.entity';
import { Transaction, TransactionType, TransactionStatus } from '../financial/entities/transaction.entity';
import { CreateDeliveryDto } from './dto/create-delivery.dto';
import { CompleteDeliveryDto } from './dto/complete-delivery.dto';

@Injectable()
export class DeliveryService {
  constructor(
    @InjectRepository(Delivery)
    private deliveryRepository: Repository<Delivery>,
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
    @InjectRepository(Transaction)
    private transactionRepository: Repository<Transaction>,
    private dataSource: DataSource,
  ) { }

  async create(createDeliveryDto: CreateDeliveryDto): Promise<Delivery> {
    const delivery = this.deliveryRepository.create(createDeliveryDto as any);
    const saved = await this.deliveryRepository.save(delivery);
    return Array.isArray(saved) ? saved[0] : saved;
  }

  async findOne(id: string): Promise<Delivery> {
    const delivery = await this.deliveryRepository.findOne({ where: { id } as any, relations: ['order', 'driver'] });
    if (!delivery) {
      throw new NotFoundException(`Delivery with ID ${id} not found`);
    }
    return delivery;
  }

  async findByOrder(orderId: string): Promise<Delivery | null> {
    return this.deliveryRepository.findOne({ where: { orderId } as any });
  }

  async updateLocation(id: string, lat: number, lng: number): Promise<Delivery> {
    const delivery = await this.findOne(id);
    delivery.currentLat = lat;
    delivery.currentLng = lng;
    return this.deliveryRepository.save(delivery);
  }

  async start(id: string): Promise<Delivery> {
    const delivery = await this.findOne(id);
    delivery.startedAt = new Date();
    return this.deliveryRepository.save(delivery);
  }

  async complete(id: string, proof: CompleteDeliveryDto): Promise<Delivery> {
    const delivery = await this.findOne(id);

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1. Update Delivery
      delivery.completedAt = new Date();
      delivery.photoUrl = proof.photoUrl;
      delivery.signature = proof.signature;
      delivery.signedBy = proof.signedBy;
      const savedDelivery = await queryRunner.manager.save(delivery);

      // 2. Update Order
      const order = await queryRunner.manager.findOne(Order, { where: { id: delivery.orderId } });
      if (order) {
        order.status = OrderStatus.COMPLETED;
        order.completedAt = new Date();
        await queryRunner.manager.save(order);

        // 3. Create Financial Transaction
        const transaction = this.transactionRepository.create({
          orderId: order.id,
          tenantId: order.tenantId,
          type: TransactionType.CREDIT,
          amount: order.total,
          status: TransactionStatus.PENDING,
          description: `Receita Ref Pedido ${order.orderNumber}`,
          organizationId: order.organizationId,
        });
        await queryRunner.manager.save(transaction);
      }

      await queryRunner.commitTransaction();
      return savedDelivery;
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }
}
