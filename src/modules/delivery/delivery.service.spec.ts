import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ClsService } from 'nestjs-cls';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DeliveryService } from './delivery.service';
import { Delivery, DeliveryStatus, DeliveryType } from './entities/delivery.entity';
import { DeliveryTrackingLog } from './entities/delivery-tracking-log.entity';
import { DeliveryDocument } from './entities/delivery-document.entity';
import { ActivityLogService } from '../activity-log/activity-log.service';

describe('DeliveryService', () => {
  let service: DeliveryService;

  const deliveryRepositoryMock = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    findAndCount: jest.fn(),
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
    getRepository: jest.fn(),
  };

  const activityLogServiceMock = {
    log: jest.fn(),
  };

  const eventEmitterMock = {
    emitAsync: jest.fn(),
  };

  const clsMock = {
    get: jest.fn(),
  };

  const configServiceMock = {
    get: jest.fn().mockReturnValue('/uploads'),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DeliveryService,
        { provide: getRepositoryToken(Delivery), useValue: deliveryRepositoryMock },
        { provide: getRepositoryToken(DeliveryTrackingLog), useValue: trackingLogRepositoryMock },
        { provide: getRepositoryToken(DeliveryDocument), useValue: documentRepositoryMock },
        { provide: DataSource, useValue: dataSourceMock },
        { provide: ActivityLogService, useValue: activityLogServiceMock },
        { provide: EventEmitter2, useValue: eventEmitterMock },
        { provide: ClsService, useValue: clsMock },
        { provide: ConfigService, useValue: configServiceMock },
      ],
    }).compile();

    service = module.get<DeliveryService>(DeliveryService);
  });

  it('throws NotFoundException when delivery is missing in findOne', async () => {
    deliveryRepositoryMock.findOne.mockResolvedValue(null);

    await expect(service.findOne('delivery-1', 'tenant-1')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('throws BadRequestException for invalid status transition input', async () => {
    jest.spyOn(service, 'findOne').mockResolvedValue({ id: 'delivery-1' } as Delivery);

    await expect(
      service.updateStatus('delivery-1', 'invalid-status', 'tenant-1'),
    ).rejects.toBeInstanceOf(BadRequestException);
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

    const updated = await service.updateStatus('delivery-1', 'IN_ROUTE', 'tenant-1');

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

    const updated = await service.updateStatus('delivery-1', 'COMPLETED', 'tenant-1');

    expect(updated.status).toBe(DeliveryStatus.COMPLETED);
    expect(updated.completedAt).toBeInstanceOf(Date);
  });

  it('creates independent delivery without driver', async () => {
    const payload = {
      tenantId: 'tenant-1',
      destinationAddress: {
        street: 'Rua A',
        number: '100',
        neighborhood: 'Centro',
        city: 'SP',
        state: 'SP',
        zipCode: '01000',
        country: 'BR',
      },
    };
    deliveryRepositoryMock.create.mockReturnValue({ ...payload, status: DeliveryStatus.PENDING });
    deliveryRepositoryMock.save.mockImplementation(async (entity) => entity);

    const result = await service.createIndependent(payload);

    expect(deliveryRepositoryMock.create).toHaveBeenCalledWith(
      expect.objectContaining({
        tenantId: 'tenant-1',
        driverId: null,
        status: DeliveryStatus.PENDING,
      }),
    );
    expect(result.status).toBe(DeliveryStatus.PENDING);
  });

  it('creates independent delivery with explicit driver and type', async () => {
    const payload = {
      tenantId: 'tenant-1',
      driverId: 'driver-1',
      type: DeliveryType.INTERNAL_TRANSFER,
      destinationAddress: {
        street: 'Rua B',
        number: '200',
        neighborhood: 'Centro',
        city: 'SP',
        state: 'SP',
        zipCode: '01000',
        country: 'BR',
      },
    };
    deliveryRepositoryMock.create.mockReturnValue({ ...payload, status: DeliveryStatus.PENDING });
    deliveryRepositoryMock.save.mockImplementation(async (entity) => ({
      id: 'delivery-1',
      ...entity,
    }));

    const result = await service.createIndependent(payload);

    expect(deliveryRepositoryMock.create).toHaveBeenCalledWith(
      expect.objectContaining({
        driverId: 'driver-1',
        type: DeliveryType.INTERNAL_TRANSFER,
      }),
    );
    expect(result.id).toBe('delivery-1');
  });

  it('defaults independent delivery type to SERVICE when omitted', async () => {
    deliveryRepositoryMock.create.mockReturnValue({ status: DeliveryStatus.PENDING });
    deliveryRepositoryMock.save.mockImplementation(async (entity) => entity);

    await service.createIndependent({
      tenantId: 'tenant-1',
      destinationAddress: {
        street: 'Rua C',
        number: '300',
        neighborhood: 'Centro',
        city: 'SP',
        state: 'SP',
        zipCode: '01000',
        country: 'BR',
      },
    });

    expect(deliveryRepositoryMock.create).toHaveBeenCalledWith(
      expect.objectContaining({ type: DeliveryType.SERVICE }),
    );
  });

  it('rejects external URLs when uploading delivery document', async () => {
    jest
      .spyOn(service, 'findOne')
      .mockResolvedValue({ id: 'delivery-1', tenantId: 'tenant-1' } as Delivery);

    await expect(
      service.uploadDocument(
        'delivery-1',
        { type: 'PHOTO' as never, url: 'https://evil.example/photo.jpg' },
        'driver-1',
        'tenant-1',
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('accepts internal storage URLs when uploading delivery document', async () => {
    jest.spyOn(service, 'findOne').mockResolvedValue({
      id: 'delivery-1',
      tenantId: 'tenant-1',
      driverId: 'driver-1',
    } as Delivery);
    documentRepositoryMock.create.mockImplementation((input) => input);
    documentRepositoryMock.save.mockImplementation(async (input) => ({ id: 'doc-1', ...input }));

    const result = await service.uploadDocument(
      'delivery-1',
      { type: 'PHOTO' as never, url: '/uploads/tenant-1/photo.jpg' },
      'driver-1',
      'tenant-1',
    );

    expect(result.url).toBe('/uploads/tenant-1/photo.jpg');
  });
});
