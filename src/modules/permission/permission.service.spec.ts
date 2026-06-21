import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { In } from 'typeorm';
import { PermissionService } from './permission.service';
import { Permission } from './entities/permission.entity';
import { UserRole } from '../user/entities/user-role.entity';
import { UserPermission } from '../user/entities/user-permission.entity';
import { User } from '../user/entities/user.entity';
import { Role } from '../role/entities/role.entity';
import { TenantModuleService } from '../tenant-module/tenant-module.service';

describe('PermissionService', () => {
  let service: PermissionService;

  const permissionRepositoryMock = {
    find: jest.fn(),
    findOne: jest.fn(),
  };

  const tenantModuleServiceMock = {
    getActiveModules: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PermissionService,
        { provide: getRepositoryToken(Permission), useValue: permissionRepositoryMock },
        { provide: getRepositoryToken(UserRole), useValue: {} },
        { provide: getRepositoryToken(UserPermission), useValue: {} },
        { provide: getRepositoryToken(User), useValue: {} },
        { provide: getRepositoryToken(Role), useValue: {} },
        { provide: TenantModuleService, useValue: tenantModuleServiceMock },
      ],
    }).compile();

    service = module.get<PermissionService>(PermissionService);
  });

  it('findAll filters permissions by tenant active modules', async () => {
    const activeModules = ['erp', 'order_management', 'delivery'];
    const permissions = [
      { id: 'perm-1', name: 'order.read', module: 'order_management' },
      { id: 'perm-2', name: 'delivery.read', module: 'delivery' },
    ] as Permission[];

    tenantModuleServiceMock.getActiveModules.mockResolvedValue(activeModules);
    permissionRepositoryMock.find.mockResolvedValue(permissions);

    const result = await service.findAll('tenant-1');

    expect(tenantModuleServiceMock.getActiveModules).toHaveBeenCalledWith('tenant-1');
    expect(permissionRepositoryMock.find).toHaveBeenCalledWith({
      where: { module: In(activeModules) },
    });
    expect(result).toEqual(permissions);
  });

  it('findAll returns empty list when tenant has no matching module permissions', async () => {
    tenantModuleServiceMock.getActiveModules.mockResolvedValue(['erp']);
    permissionRepositoryMock.find.mockResolvedValue([]);

    const result = await service.findAll('tenant-2');

    expect(result).toEqual([]);
    expect(permissionRepositoryMock.find).toHaveBeenCalledWith({
      where: { module: In(['erp']) },
    });
  });
});
