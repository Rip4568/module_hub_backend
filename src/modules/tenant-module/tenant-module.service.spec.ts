import { BadRequestException, HttpException, HttpStatus } from '@nestjs/common';
import { Repository } from 'typeorm';
import { TenantModuleService } from './tenant-module.service';
import { TenantModuleEntity } from './entities/tenant-module.entity';
import { Permission } from '../permission/entities/permission.entity';
import { Role } from '../role/entities/role.entity';
import { RolePermission } from '../role/entities/role-permission.entity';
import { RoleService } from '../role/role.service';

describe('TenantModuleService', () => {
  let service: TenantModuleService;

  const tenantModuleRepositoryMock = {
    count: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
  };

  const permissionRepositoryMock = {
    find: jest.fn(),
  };

  const roleRepositoryMock = {
    findOne: jest.fn(),
  };

  const rolePermissionRepositoryMock = {};

  const roleServiceMock = {
    grantPermissions: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    service = new TenantModuleService(
      tenantModuleRepositoryMock as unknown as Repository<TenantModuleEntity>,
      permissionRepositoryMock as unknown as Repository<Permission>,
      roleRepositoryMock as unknown as Repository<Role>,
      rolePermissionRepositoryMock as unknown as Repository<RolePermission>,
      roleServiceMock as unknown as RoleService,
    );
  });

  it('throws PLAN_UPGRADE_REQUIRED when plan limit is exceeded', async () => {
    tenantModuleRepositoryMock.count.mockResolvedValue(5);
    tenantModuleRepositoryMock.findOne.mockResolvedValue(null);

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
    await expect(service.deactivateModule('tenant-1', 'tenant')).rejects.toBeInstanceOf(BadRequestException);
  });
});
