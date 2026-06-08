import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { DeliveryService } from './delivery.service';
import { Delivery, DeliveryStatus } from './entities/delivery.entity';
import { Order } from '../order/entities/order.entity';
import { Transaction } from '../financial/entities/transaction.entity';
import { DeliveryTrackingLog } from './entities/delivery-tracking-log.entity';
import { DeliveryDocument } from './entities/delivery-document.entity';

describe('DeliveryService', () => {
  let service: DeliveryService;

  const deliveryRepositoryMock = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  const orderRepositoryMock = {
    findOne: jest.fn(),
  };

  const transactionRepositoryMock = {
    create: jest.fn(),
    save: jest.fn(),
  };

  const trackingLogRepositoryMock = {
    create: jest.fn(),
  };

  const documentRepositoryMock = {
    create: jest.fn(),
    save: jest.fn(),
  };

  const dataSourceMock = {
    createQueryRunner: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DeliveryService,
        { provide: getRepositoryToken(Delivery), useValue: deliveryRepositoryMock },
        { provide: getRepositoryToken(Order), useValue: orderRepositoryMock },
        { provide: getRepositoryToken(Transaction), useValue: transactionRepositoryMock },
        { provide: getRepositoryToken(DeliveryTrackingLog), useValue: trackingLogRepositoryMock },
        { provide: getRepositoryToken(DeliveryDocument), useValue: documentRepositoryMock },
        { provide: DataSource, useValue: dataSourceMock },
      ],
    }).compile();

    service = module.get<DeliveryService>(DeliveryService);
  });

  it('throws NotFoundException when delivery is missing in findOne', async () => {
    deliveryRepositoryMock.findOne.mockResolvedValue(null);

    await expect(service.findOne('delivery-1')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('throws BadRequestException for invalid status transition input', async () => {
    jest.spyOn(service, 'findOne').mockResolvedValue({ id: 'delivery-1' } as Delivery);

    await expect(service.updateStatus('delivery-1', 'invalid-status')).rejects.toBeInstanceOf(BadRequestException);
  });

  it('sets startedAt when moving to IN_ROUTE', async () => {
    const delivery = {
      id: 'delivery-1',
      status: DeliveryStatus.PENDING,
      startedAt: null,
      completedAt: null,
    } as unknown as Delivery;
    jest.spyOn(service, 'findOne').mockResolvedValue(delivery);
    deliveryRepositoryMock.save.mockImplementation(async (entity) => entity);

    const updated = await service.updateStatus('delivery-1', 'IN_ROUTE');

    expect(updated.status).toBe(DeliveryStatus.IN_ROUTE);
    expect(updated.startedAt).toBeInstanceOf(Date);
    expect(deliveryRepositoryMock.save).toHaveBeenCalledWith(delivery);
  });

  it('sets completedAt when moving to COMPLETED', async () => {
    const delivery = {
      id: 'delivery-1',
      status: DeliveryStatus.IN_ROUTE,
      startedAt: new Date(),
      completedAt: null,
    } as unknown as Delivery;
    jest.spyOn(service, 'findOne').mockResolvedValue(delivery);
    deliveryRepositoryMock.save.mockImplementation(async (entity) => entity);

    const updated = await service.updateStatus('delivery-1', 'COMPLETED');

    expect(updated.status).toBe(DeliveryStatus.COMPLETED);
    expect(updated.completedAt).toBeInstanceOf(Date);
  });
});
