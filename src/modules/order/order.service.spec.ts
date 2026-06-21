import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ModuleRef } from '@nestjs/core';
import { ClsService } from 'nestjs-cls';
import { NotFoundException } from '@nestjs/common';
import { OrderService } from './order.service';
import { Order, OrderStatus } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { Delivery } from '../delivery/entities/delivery.entity';
import { Product } from '../product/entities/product.entity';
import { TenantModuleService } from '../tenant-module/tenant-module.service';
import { ActivityLogService } from '../activity-log/activity-log.service';
import { RequestContext } from '../../common/context/request.context';
import { DomainEvents } from '../../common/events/domain.events';

describe('OrderService', () => {
  let service: OrderService;

  const orderRepositoryMock = {
    create: jest.fn(),
    findOne: jest.fn(),
    save: jest.fn(),
  };

  const orderItemRepositoryMock = {
    create: jest.fn(),
  };

  const deliveryRepositoryMock = {
    create: jest.fn(),
  };

  const queryRunnerMock = {
    connect: jest.fn(),
    startTransaction: jest.fn(),
    commitTransaction: jest.fn(),
    rollbackTransaction: jest.fn(),
    release: jest.fn(),
    manager: {
      save: jest.fn(),
      find: jest.fn(),
    },
  };

  const dataSourceMock = {
    createQueryRunner: jest.fn(() => queryRunnerMock),
  };

  const clsMock = {
    get: jest.fn(),
    run: jest.fn((fn: () => Promise<unknown>) => fn()),
    set: jest.fn(),
  };

  const eventEmitterMock = {
    emitAsync: jest.fn(),
  };

  const moduleRefMock = {
    get: jest.fn(),
  };

  const tenantModuleServiceMock = {
    isModuleEnabled: jest.fn(),
  };

  const activityLogServiceMock = {
    log: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    clsMock.get.mockImplementation((key: string) =>
      key === RequestContext.USER_ID ? 'user-1' : undefined,
    );
    eventEmitterMock.emitAsync.mockResolvedValue(undefined);
    queryRunnerMock.manager.save.mockImplementation(async (entity) => ({
      ...entity,
      id: entity.id ?? 'order-1',
    }));

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrderService,
        { provide: getRepositoryToken(Order), useValue: orderRepositoryMock },
        { provide: getRepositoryToken(OrderItem), useValue: orderItemRepositoryMock },
        { provide: getRepositoryToken(Delivery), useValue: deliveryRepositoryMock },
        { provide: DataSource, useValue: dataSourceMock },
        { provide: ClsService, useValue: clsMock },
        { provide: EventEmitter2, useValue: eventEmitterMock },
        { provide: ModuleRef, useValue: moduleRefMock },
        { provide: TenantModuleService, useValue: tenantModuleServiceMock },
        { provide: ActivityLogService, useValue: activityLogServiceMock },
      ],
    }).compile();

    service = module.get<OrderService>(OrderService);
  });

  it('creates order without items (standalone flow)', async () => {
    orderRepositoryMock.create.mockReturnValue({
      tenantId: 'tenant-1',
      customerName: 'Customer',
      status: OrderStatus.PENDING,
    });
    orderRepositoryMock.findOne.mockResolvedValue({
      id: 'order-1',
      tenantId: 'tenant-1',
      status: OrderStatus.PENDING,
      items: [],
    });

    const result = await service.create({
      tenantId: 'tenant-1',
      customerName: 'Customer',
      shippingAddress: {
        street: 'Rua A',
        number: '1',
        neighborhood: 'Centro',
        city: 'SP',
        state: 'SP',
        zipCode: '01000',
        country: 'BR',
      },
      items: [],
    });

    expect(result.id).toBe('order-1');
    expect(queryRunnerMock.commitTransaction).toHaveBeenCalled();
    expect(eventEmitterMock.emitAsync).toHaveBeenCalledWith(
      DomainEvents.ORDER_CREATED,
      expect.objectContaining({ tenantId: 'tenant-1', orderId: 'order-1' }),
    );
    expect(eventEmitterMock.emitAsync).not.toHaveBeenCalledWith(
      DomainEvents.ORDER_STOCK_DEDUCT,
      expect.anything(),
    );
  });

  it('creates order with items and emits stock deduct event without checking inventory module', async () => {
    const product = { id: 'product-1', name: 'Widget', price: 10 };
    orderRepositoryMock.create.mockReturnValue({
      tenantId: 'tenant-1',
      customerName: 'Customer',
    });
    queryRunnerMock.manager.find
      .mockResolvedValueOnce([product])
      .mockResolvedValueOnce([]);
    orderItemRepositoryMock.create.mockImplementation((item) => item);
    orderRepositoryMock.findOne.mockResolvedValue({
      id: 'order-1',
      tenantId: 'tenant-1',
      status: OrderStatus.PENDING,
      items: [{ productId: 'product-1', quantity: 2 }],
      total: 20,
    });

    tenantModuleServiceMock.isModuleEnabled.mockResolvedValue(false);

    const result = await service.create({
      tenantId: 'tenant-1',
      customerName: 'Customer',
      shippingAddress: {
        street: 'Rua A',
        number: '1',
        neighborhood: 'Centro',
        city: 'SP',
        state: 'SP',
        zipCode: '01000',
        country: 'BR',
      },
      items: [{ productId: 'product-1', quantity: 2 }],
    });

    expect(result.total).toBe(20);
    expect(eventEmitterMock.emitAsync).toHaveBeenCalledWith(
      DomainEvents.ORDER_STOCK_DEDUCT,
      expect.objectContaining({
        tenantId: 'tenant-1',
        items: [{ productId: 'product-1', variantId: undefined, quantity: 2 }],
      }),
    );
    expect(tenantModuleServiceMock.isModuleEnabled).not.toHaveBeenCalledWith(
      'tenant-1',
      'inventory',
    );
  });

  it('throws NotFoundException when product is missing', async () => {
    orderRepositoryMock.create.mockReturnValue({ tenantId: 'tenant-1' });
    queryRunnerMock.manager.find.mockResolvedValueOnce([]).mockResolvedValueOnce([]);

    await expect(
      service.create({
        tenantId: 'tenant-1',
        customerName: 'Customer',
        shippingAddress: {
          street: 'Rua A',
          number: '1',
          neighborhood: 'Centro',
          city: 'SP',
          state: 'SP',
          zipCode: '01000',
          country: 'BR',
        },
        items: [{ productId: 'missing-product', quantity: 1 }],
      }),
    ).rejects.toBeInstanceOf(NotFoundException);

    expect(queryRunnerMock.rollbackTransaction).toHaveBeenCalled();
  });

  it('checkout resolves inline customer when ecommerce module is inactive', async () => {
    tenantModuleServiceMock.isModuleEnabled.mockResolvedValue(false);
    const createSpy = jest.spyOn(service, 'create').mockResolvedValue({ id: 'order-1' } as Order);

    await service.checkout('tenant-1', {
      customerName: 'Inline Customer',
      customer: { name: 'Inline Customer', email: 'inline@test.com' },
      shippingAddress: {
        street: 'Rua B',
        number: '2',
        neighborhood: 'Centro',
        city: 'SP',
        state: 'SP',
        zipCode: '01000',
        country: 'BR',
      },
      items: [],
    });

    expect(createSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        tenantId: 'tenant-1',
        customerName: 'Inline Customer',
        customerEmail: 'inline@test.com',
      }),
    );
    expect(moduleRefMock.get).not.toHaveBeenCalled();
  });
});
