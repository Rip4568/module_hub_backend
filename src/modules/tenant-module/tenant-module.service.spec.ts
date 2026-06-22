import { BadRequestException, HttpException, HttpStatus } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ClsService } from 'nestjs-cls';
import { Repository } from 'typeorm';
import { TenantModuleService } from './tenant-module.service';
import { TenantModuleEntity } from './entities/tenant-module.entity';
import { Permission } from '../permission/entities/permission.entity';
import { Role } from '../role/entities/role.entity';
import { RoleService } from '../role/role.service';
import { PlanService } from '../plan/plan.service';
import { DomainEvents } from '../../common/events/domain.events';

describe('TenantModuleService', () => {
  let service: TenantModuleService;

  const tenantModuleRepositoryMock = {
    count: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    remove: jest.fn(),
  };

  const permissionRepositoryMock = {
    find: jest.fn(),
  };

  const roleRepositoryMock = {
    findOne: jest.fn(),
  };

  const roleServiceMock = {
    grantPermissions: jest.fn(),
  };

  const planServiceMock = {
    getModuleLimitForTenant: jest.fn(),
    getPlanForTenant: jest.fn(),
  };

  const eventEmitterMock = {
    emitAsync: jest.fn(),
  };

  const clsMock = {
    get: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    tenantModuleRepositoryMock.find.mockReset();
    tenantModuleRepositoryMock.find.mockResolvedValue([]);
    planServiceMock.getModuleLimitForTenant.mockResolvedValue(5);
    planServiceMock.getPlanForTenant.mockResolvedValue({
      id: 'starter',
      name: 'Starter',
      maxBillableModules: 5,
    });
    service = new TenantModuleService(
      tenantModuleRepositoryMock as unknown as Repository<TenantModuleEntity>,
      permissionRepositoryMock as unknown as Repository<Permission>,
      roleRepositoryMock as unknown as Repository<Role>,
      roleServiceMock as unknown as RoleService,
      planServiceMock as unknown as PlanService,
      eventEmitterMock as unknown as EventEmitter2,
      clsMock as unknown as ClsService,
    );
  });

  it('throws PLAN_UPGRADE_REQUIRED when billable plan limit is exceeded', async () => {
    tenantModuleRepositoryMock.find
      .mockResolvedValueOnce(
        Array.from({ length: 5 }, (_, index) => ({
          id: `module-${index + 1}`,
          tenantId: 'tenant-1',
          moduleId: `custom-module-${index + 1}`,
          isActive: true,
        })),
      )
      .mockResolvedValueOnce([]);

    try {
      await service.activateModule('tenant-1', 'documents');
      fail('Expected activateModule to throw');
    } catch (error) {
      const exception = error as HttpException;
      expect(exception.getStatus()).toBe(HttpStatus.PAYMENT_REQUIRED);
      expect(exception.getResponse()).toMatchObject({
        code: 'PLAN_UPGRADE_REQUIRED',
        message: expect.stringContaining('Starter'),
      });
    }
  });

  it('allows unlimited modules for enterprise plan', async () => {
    planServiceMock.getModuleLimitForTenant.mockResolvedValue(null);
    planServiceMock.getPlanForTenant.mockResolvedValue({
      id: 'enterprise',
      name: 'Enterprise',
      maxBillableModules: null,
    });
    tenantModuleRepositoryMock.find
      .mockResolvedValueOnce(
        Array.from({ length: 10 }, (_, index) => ({
          id: `module-${index + 1}`,
          tenantId: 'tenant-1',
          moduleId: `custom-module-${index + 1}`,
          isActive: true,
        })),
      )
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);
    tenantModuleRepositoryMock.create.mockImplementation((payload) => payload);
    tenantModuleRepositoryMock.save.mockImplementation(async (payload) => ({
      id: 'module-new',
      ...payload,
    }));
    roleRepositoryMock.findOne.mockResolvedValue({ id: 'role-admin' });
    permissionRepositoryMock.find.mockResolvedValue([]);
    clsMock.get.mockReturnValue('user-1');

    const result = await service.activateModule('tenant-1', 'documents');

    expect(result.moduleId).toBe('document');
    expect(result.isActive).toBe(true);
  });

  it('does not count essential modules toward plan limit', async () => {
    tenantModuleRepositoryMock.find
      .mockResolvedValueOnce([
        { id: '1', tenantId: 'tenant-1', moduleId: 'erp', isActive: true },
        { id: '2', tenantId: 'tenant-1', moduleId: 'tenant', isActive: true },
        { id: '3', tenantId: 'tenant-1', moduleId: 'auth', isActive: true },
        { id: '4', tenantId: 'tenant-1', moduleId: 'ecommerce', isActive: true },
        { id: '5', tenantId: 'tenant-1', moduleId: 'delivery', isActive: true },
      ])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);
    tenantModuleRepositoryMock.create.mockImplementation((payload) => payload);
    tenantModuleRepositoryMock.save.mockImplementation(async (payload) => ({
      id: 'module-new',
      ...payload,
    }));
    roleRepositoryMock.findOne.mockResolvedValue({ id: 'role-admin' });
    permissionRepositoryMock.find.mockResolvedValue([]);
    clsMock.get.mockReturnValue('user-1');

    const result = await service.activateModule('tenant-1', 'order_management');

    expect(result.moduleId).toBe('order_management');
    expect(result.isActive).toBe(true);
  });

  it('returns dynamic maxModules in getModuleUsageForTenant', async () => {
    planServiceMock.getModuleLimitForTenant.mockResolvedValue(10);
    tenantModuleRepositoryMock.find.mockResolvedValue([
      { id: '1', tenantId: 'tenant-1', moduleId: 'ecommerce', isActive: true },
    ]);

    const usage = await service.getModuleUsageForTenant('tenant-1');

    expect(usage.maxModules).toBe(10);
    expect(usage.billableActiveCount).toBe(1);
    expect(usage.isAtLimit).toBe(false);
  });

  it('blocks deactivation of essential modules with BadRequestException', async () => {
    await expect(service.deactivateModule('tenant-1', 'tenant')).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('activates a new module and grants admin permissions', async () => {
    tenantModuleRepositoryMock.find.mockResolvedValueOnce([]).mockResolvedValueOnce([]);
    tenantModuleRepositoryMock.create.mockImplementation((payload) => payload);
    tenantModuleRepositoryMock.save.mockImplementation(async (payload) => ({
      id: 'module-new',
      ...payload,
    }));
    roleRepositoryMock.findOne.mockResolvedValue({ id: 'role-admin', tenantId: 'tenant-1' });
    permissionRepositoryMock.find.mockResolvedValue([
      { id: 'perm-1', module: 'document' },
      { id: 'perm-2', module: 'document' },
    ]);
    clsMock.get.mockReturnValue('user-1');

    const result = await service.activateModule('tenant-1', 'documents');

    expect(result.moduleId).toBe('document');
    expect(result.isActive).toBe(true);
    expect(roleServiceMock.grantPermissions).toHaveBeenCalledWith('role-admin', [
      'perm-1',
      'perm-2',
    ]);
    expect(eventEmitterMock.emitAsync).toHaveBeenCalledWith(
      DomainEvents.MODULE_ACTIVATED,
      expect.objectContaining({ tenantId: 'tenant-1', moduleId: 'document' }),
    );
  });

  it('reactivates an existing inactive module without hitting plan limit', async () => {
    tenantModuleRepositoryMock.find
      .mockResolvedValueOnce([
        {
          id: 'module-existing',
          tenantId: 'tenant-1',
          moduleId: 'delivery',
          isActive: false,
        },
      ])
      .mockResolvedValueOnce([
        {
          id: 'module-existing',
          tenantId: 'tenant-1',
          moduleId: 'delivery',
          isActive: false,
        },
      ]);
    tenantModuleRepositoryMock.save.mockImplementation(async (payload) => payload);
    roleRepositoryMock.findOne.mockResolvedValue({ id: 'role-admin' });
    permissionRepositoryMock.find.mockResolvedValue([]);
    clsMock.get.mockReturnValue('user-1');

    const result = await service.activateModule('tenant-1', 'delivery');

    expect(result.isActive).toBe(true);
    expect(tenantModuleRepositoryMock.create).not.toHaveBeenCalled();
  });
});
