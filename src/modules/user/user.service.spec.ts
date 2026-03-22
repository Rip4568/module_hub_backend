import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { UserService } from './user.service';
import { User } from './entities/user.entity';
import { UserRole } from './entities/user-role.entity';
import { UserPermission } from './entities/user-permission.entity';
import { Permission } from '../permission/entities/permission.entity';
import { HashUtils } from '../../common/utils/hash.utils';

describe('UserService', () => {
  let service: UserService;

  const userRepositoryMock = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    remove: jest.fn(),
  };

  const userRoleRepositoryMock = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
  };

  const userPermissionRepositoryMock = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  const permissionRepositoryMock = {
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        { provide: getRepositoryToken(User), useValue: userRepositoryMock },
        { provide: getRepositoryToken(UserRole), useValue: userRoleRepositoryMock },
        { provide: getRepositoryToken(UserPermission), useValue: userPermissionRepositoryMock },
        { provide: getRepositoryToken(Permission), useValue: permissionRepositoryMock },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
  });

  it('hashes password before persisting user', async () => {
    const hashSpy = jest.spyOn(HashUtils, 'hash').mockResolvedValue('hashed-password');
    userRepositoryMock.create.mockImplementation((input) => ({ ...input }));
    userRepositoryMock.save.mockImplementation(async (input) => input);

    const created = await service.create({
      name: 'Admin',
      email: 'admin@tenant.com',
      password: 'plain-password',
      tenantId: 'tenant-1',
    });

    expect(hashSpy).toHaveBeenCalledWith('plain-password');
    expect(created.password).toBe('hashed-password');
    hashSpy.mockRestore();
  });

  it('throws NotFoundException when tenant-scoped user is not found', async () => {
    userRepositoryMock.findOne.mockResolvedValue(null);

    await expect(service.findOneByTenant('user-1', 'tenant-1')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('removes user only if user exists in tenant scope', async () => {
    const scopedUser = { id: 'user-1', tenantId: 'tenant-1' };
    jest.spyOn(service, 'findOneByTenant').mockResolvedValue(scopedUser as User);
    userRepositoryMock.remove.mockResolvedValue(undefined);

    await service.removeByTenant('user-1', 'tenant-1');

    expect(service.findOneByTenant).toHaveBeenCalledWith('user-1', 'tenant-1');
    expect(userRepositoryMock.remove).toHaveBeenCalledWith(scopedUser);
  });
});
