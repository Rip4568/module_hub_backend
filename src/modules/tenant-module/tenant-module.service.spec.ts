import { BadRequestException, HttpException, HttpStatus } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ClsService } from 'nestjs-cls';
import { Repository } from 'typeorm';
import { TenantModuleService } from './tenant-module.service';
import { TenantModuleEntity } from './entities/tenant-module.entity';
import { Permission } from '../permission/entities/permission.entity';
import { Role } from '../role/entities/role.entity';
import { RoleService } from '../role/role.service';

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
});
