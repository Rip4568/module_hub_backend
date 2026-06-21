import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ClsService } from 'nestjs-cls';
import { Delivery, DeliveryStatus, DeliveryType } from './entities/delivery.entity';
import { DeliveryTrackingLog } from './entities/delivery-tracking-log.entity';
import { DeliveryDocument, DeliveryDocumentType } from './entities/delivery-document.entity';
import { Order, OrderStatus } from '../order/entities/order.entity';
import { CreateDeliveryDto } from './dto/create-delivery.dto';
import { CompleteDeliveryDto } from './dto/complete-delivery.dto';
import { PaginatedResult } from '../../common/interfaces/paginated-result.interface';
import { ActivityLogService } from '../activity-log/activity-log.service';
import { RequestContext } from '../../common/context/request.context';
import { DomainEvents, DeliveryCompletedPayload } from '../../common/events/domain.events';
import { assertAllowedStorageUrl } from '../../infrastructure/storage/utils/validate-storage-url.util';
import { normalizePagination } from '../../common/utils/pagination.util';

@Injectable()
export class DeliveryService {
  constructor(
    @InjectRepository(Delivery)
    private deliveryRepository: Repository<Delivery>,
    @InjectRepository(DeliveryTrackingLog)
    private trackingLogRepository: Repository<DeliveryTrackingLog>,
    @InjectRepository(DeliveryDocument)
    private documentRepository: Repository<DeliveryDocument>,
    private dataSource: DataSource,
    private readonly activityLogService: ActivityLogService,
    private readonly eventEmitter: EventEmitter2,
    private readonly cls: ClsService,
    private readonly configService: ConfigService,
  ) {}

  async findAll(tenantId: string, page = 1, limit = 20): Promise<PaginatedResult<Delivery>> {
    const { page: safePage, limit: safeLimit, skip } = normalizePagination(page, limit);
    const [data, total] = await this.deliveryRepository.findAndCount({
      where: { tenantId },
      relations: ['order', 'driver', 'driver.user'],
      skip,
      take: safeLimit,
      order: { createdAt: 'DESC' },
    });
    return {
      data,
      total,
      page: safePage,
      limit: safeLimit,
      totalPages: Math.ceil(total / safeLimit),
    };
  }

  async create(createDeliveryDto: CreateDeliveryDto & { tenantId: string }): Promise<Delivery> {
    const delivery = this.deliveryRepository.create(createDeliveryDto);
    return this.deliveryRepository.save(delivery);
  }

  async update(
    id: string,
    payload: Partial<CreateDeliveryDto>,
    tenantId: string,
  ): Promise<Delivery> {
    const delivery = await this.findOne(id, tenantId);
    Object.assign(delivery, payload);
    return this.deliveryRepository.save(delivery);
  }

  async updateStatus(id: string, status: string, tenantId: string): Promise<Delivery> {
    const delivery = await this.findOne(id, tenantId);
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

  async createIndependent(
    data: Partial<CreateDeliveryDto> & { tenantId: string },
  ): Promise<Delivery> {
    const delivery = this.deliveryRepository.create({
      ...data,
      type: data.type || DeliveryType.SERVICE,
      status: DeliveryStatus.PENDING,
      driverId: data.driverId ?? null,
    });
    return this.deliveryRepository.save(delivery);
  }

  async findOne(id: string, tenantId: string): Promise<Delivery> {
    const delivery = await this.deliveryRepository.findOne({
      where: { id, tenantId },
      relations: ['order', 'driver', 'driver.user'],
    });
    if (!delivery) {
      throw new NotFoundException(`Delivery with ID ${id} not found`);
    }
    return delivery;
  }

  async findByTrackingCode(trackingCode: string, tenantId: string): Promise<Delivery | null> {
    const order = await this.dataSource
      .getRepository(Order)
      .findOne({ where: { trackingCode, tenantId } });
    if (!order) {
      return null;
    }
    return this.deliveryRepository.findOne({
      where: { orderId: order.id },
      relations: ['order', 'driver', 'driver.user'],
    });
  }

  async findByOrder(orderId: string, tenantId: string): Promise<Delivery | null> {
    return this.deliveryRepository.findOne({ where: { orderId, tenantId } });
  }

  async updateLocation(
    id: string,
    data: { lat: number; lng: number; batteryLevel?: number; timestamp?: Date },
    driverId: string,
    tenantId: string,
  ): Promise<Delivery> {
    const delivery = await this.findOne(id, tenantId);

    if (delivery.driverId && delivery.driverId !== driverId) {
      throw new ForbiddenException('This delivery is not assigned to you');
    }

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
    driverId: string,
    tenantId: string,
  ): Promise<DeliveryDocument> {
    const delivery = await this.findOne(id, tenantId);

    if (delivery.driverId && delivery.driverId !== driverId) {
      throw new ForbiddenException('This delivery is not assigned to you');
    }

    const storageBaseUrl = this.configService.get<string>('STORAGE_LOCAL_BASE_URL', '/uploads');
    assertAllowedStorageUrl(data.url, storageBaseUrl);

    const document = this.documentRepository.create({
      deliveryId: id,
      type: data.type,
      url: data.url,
      tenantId: delivery.tenantId,
    });

    return this.documentRepository.save(document);
  }

  async start(id: string, tenantId: string): Promise<Delivery> {
    const delivery = await this.findOne(id, tenantId);
    delivery.startedAt = new Date();
    return this.deliveryRepository.save(delivery);
  }

  async complete(id: string, proof: CompleteDeliveryDto, tenantId: string): Promise<Delivery> {
    const delivery = await this.findOne(id, tenantId);
    const userId = this.cls.get(RequestContext.USER_ID);

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      delivery.completedAt = new Date();
      delivery.photoUrl = proof.photoUrl;
      delivery.signature = proof.signature;
      delivery.signedBy = proof.signedBy;
      delivery.status = DeliveryStatus.COMPLETED;
      const savedDelivery = await queryRunner.manager.save(delivery);

      let orderPayload: Pick<
        DeliveryCompletedPayload,
        'orderId' | 'orderNumber' | 'amount' | 'organizationId'
      > = {};

      if (delivery.orderId) {
        const order = await queryRunner.manager.findOne(Order, { where: { id: delivery.orderId } });
        if (order) {
          order.status = OrderStatus.COMPLETED;
          order.completedAt = new Date();
          await queryRunner.manager.save(order);

          orderPayload = {
            orderId: order.id,
            orderNumber: order.orderNumber,
            amount: order.total,
            organizationId: order.organizationId,
          };
        }
      }

      await queryRunner.commitTransaction();

      await this.activityLogService.log({
        tenantId,
        userId,
        action: 'complete',
        resource: 'delivery',
        resourceId: id,
        changes: { orderId: delivery.orderId, status: DeliveryStatus.COMPLETED },
      });

      await this.eventEmitter.emitAsync(DomainEvents.DELIVERY_COMPLETED, {
        tenantId,
        deliveryId: id,
        userId,
        ...orderPayload,
      } satisfies DeliveryCompletedPayload);

      return savedDelivery;
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }
}
