import { BadRequestException, HttpException, HttpStatus } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ClsService } from 'nestjs-cls';
import { Repository } from 'typeorm';
import { TenantModuleService } from './tenant-module.service';
import { TenantModuleEntity } from './entities/tenant-module.entity';
import { Permission } from '../permission/entities/permission.entity';
import { Role } from '../role/entities/role.entity';
import { RoleService } from '../role/role.service';
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

  const eventEmitterMock = {
    emitAsync: jest.fn(),
  };

  const clsMock = {
    get: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    service = new TenantModuleService(
      tenantModuleRepositoryMock as unknown as Repository<TenantModuleEntity>,
      permissionRepositoryMock as unknown as Repository<Permission>,
      roleRepositoryMock as unknown as Repository<Role>,
      roleServiceMock as unknown as RoleService,
      eventEmitterMock as unknown as EventEmitter2,
      clsMock as unknown as ClsService,
    );
  });

  it('throws PLAN_UPGRADE_REQUIRED when plan limit is exceeded', async () => {
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
      });
    }
  });

  it('blocks deactivation of essential modules with BadRequestException', async () => {
    await expect(service.deactivateModule('tenant-1', 'tenant')).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('activates a new module and grants admin permissions', async () => {
    tenantModuleRepositoryMock.find
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);
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
    expect(roleServiceMock.grantPermissions).toHaveBeenCalledWith('role-admin', ['perm-1', 'perm-2']);
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
