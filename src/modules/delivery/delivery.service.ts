import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Delivery, DeliveryStatus, DeliveryType } from './entities/delivery.entity';
import { DeliveryTrackingLog } from './entities/delivery-tracking-log.entity';
import { DeliveryDocument, DeliveryDocumentType } from './entities/delivery-document.entity';
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
    @InjectRepository(DeliveryTrackingLog)
    private trackingLogRepository: Repository<DeliveryTrackingLog>,
    @InjectRepository(DeliveryDocument)
    private documentRepository: Repository<DeliveryDocument>,
    private dataSource: DataSource,
  ) { }

  async findAll(): Promise<Delivery[]> {
    return this.deliveryRepository.find({
      relations: ['order', 'driver', 'driver.user'],
      order: { createdAt: 'DESC' },
    });
  }

  async create(createDeliveryDto: CreateDeliveryDto): Promise<Delivery> {
    const delivery = this.deliveryRepository.create(createDeliveryDto);
    return this.deliveryRepository.save(delivery);
  }

  async update(id: string, payload: Partial<CreateDeliveryDto>): Promise<Delivery> {
    const delivery = await this.findOne(id);
    Object.assign(delivery, payload);
    return this.deliveryRepository.save(delivery);
  }

  async updateStatus(id: string, status: string): Promise<Delivery> {
    const delivery = await this.findOne(id);
    const normalized = (status || '').toUpperCase();

    if (!(normalized in DeliveryStatus)) {
      throw new BadRequestException(`Invalid delivery status: ${status}`);
    }

    delivery.status = DeliveryStatus[normalized as keyof typeof DeliveryStatus];
    if (delivery.status === DeliveryStatus.IN_ROUTE && !delivery.startedAt) {
      delivery.startedAt = new Date();
    }
    if (delivery.status === DeliveryStatus.COMPLETED && !delivery.completedAt) {
      delivery.completedAt = new Date();
    }

    return this.deliveryRepository.save(delivery);
  }

  async createIndependent(data: Partial<CreateDeliveryDto> & { tenantId: string }): Promise<Delivery> {
    const delivery = this.deliveryRepository.create({
      ...data,
      type: data.type || DeliveryType.SERVICE,
      status: DeliveryStatus.PENDING,
    });
    return this.deliveryRepository.save(delivery);
  }

  async findOne(id: string): Promise<Delivery> {
    const delivery = await this.deliveryRepository.findOne({
      where: { id },
      relations: ['order', 'driver', 'driver.user'],
    });
    if (!delivery) {
      throw new NotFoundException(`Delivery with ID ${id} not found`);
    }
    return delivery;
  }

  async findByOrder(orderId: string): Promise<Delivery | null> {
    return this.deliveryRepository.findOne({ where: { orderId } });
  }

  async updateLocation(
    id: string,
    data: { lat: number; lng: number; batteryLevel?: number; timestamp?: Date },
    driverId: string
  ): Promise<Delivery> {
    const delivery = await this.findOne(id);

    // 1. Validate Driver Ownership
    if (delivery.driverId !== driverId) {
      throw new Error('This delivery is not assigned to you');
    }

    // 2. Logic: If first point and PENDING, move to IN_ROUTE
    if (delivery.status === DeliveryStatus.PENDING) {
      delivery.status = DeliveryStatus.IN_ROUTE;
      if (!delivery.startedAt) {
        delivery.startedAt = new Date();
      }
    }

    delivery.currentLat = data.lat;
    delivery.currentLng = data.lng;

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const savedDelivery = await queryRunner.manager.save(delivery);

      // 3. Create Tracking Log entry
      const log = this.trackingLogRepository.create({
        deliveryId: id,
        lat: data.lat,
        lng: data.lng,
        batteryLevel: data.batteryLevel,
        timestamp: data.timestamp || new Date(),
        tenantId: delivery.tenantId,
      });
      await queryRunner.manager.save(log);

      await queryRunner.commitTransaction();
      return savedDelivery as Delivery;
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async uploadDocument(
    id: string,
    data: { type: DeliveryDocumentType; url: string },
    driverId: string
  ): Promise<DeliveryDocument> {
    const delivery = await this.findOne(id);

    if (delivery.driverId !== driverId) {
      throw new Error('This delivery is not assigned to you');
    }

    const document = this.documentRepository.create({
      deliveryId: id,
      type: data.type,
      url: data.url,
      tenantId: delivery.tenantId,
    });

    return this.documentRepository.save(document);
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

      // 2. Update Order (Only if exists)
      if (delivery.orderId) {
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
