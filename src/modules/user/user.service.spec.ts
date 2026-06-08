import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { UserService } from './user.service';
import { User } from './entities/user.entity';
import { UserRole } from './entities/user-role.entity';
import { UserPermission } from './entities/user-permission.entity';
import { Permission } from '../permission/entities/permission.entity';
import { HashUtils } from '../../common/utils/hash.utils';
import { Role } from '../role/entities/role.entity';

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

  const roleRepositoryMock = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
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
        { provide: getRepositoryToken(Role), useValue: roleRepositoryMock },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
  });

  it('hashes password before persisting user', async () => {
    const hashSpy = jest.spyOn(HashUtils, 'hash').mockResolvedValue('hashed-password');
    userRepositoryMock.create.mockImplementation((input) => ({ ...input }));
    userRepositoryMock.findOne.mockResolvedValueOnce(null).mockResolvedValueOnce({
      id: 'user-1',
      name: 'Admin',
      email: 'admin@tenant.com',
      password: 'hashed-password',
      tenantId: 'tenant-1',
      roles: [],
      permissions: [],
    });
    userRepositoryMock.save.mockImplementation(async (input) => ({
      id: 'user-1',
      ...input,
    }));

    const created = await service.create({
      name: 'Admin',
      email: 'admin@tenant.com',
      password: 'plain-password',
      tenantId: 'tenant-1',
    });

    expect(hashSpy).toHaveBeenCalledWith('plain-password');
    expect(userRepositoryMock.save).toHaveBeenCalledWith(
      expect.objectContaining({
        password: 'hashed-password',
      }),
    );
    expect(created.password).toBeUndefined();
    hashSpy.mockRestore();
  });

  it('throws NotFoundException when tenant-scoped user is not found', async () => {
    userRepositoryMock.findOne.mockResolvedValue(null);

    await expect(service.findOneByTenant('user-1', 'tenant-1')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('removes user only if user exists in tenant scope', async () => {
    const scopedUser = { id: 'user-1', tenantId: 'tenant-1' };
    userRepositoryMock.findOne.mockResolvedValue(scopedUser);
    userRepositoryMock.remove.mockResolvedValue(undefined);

    await service.removeByTenant('user-1', 'tenant-1');

    expect(userRepositoryMock.findOne).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'user-1', tenantId: 'tenant-1' },
      }),
    );
    expect(userRepositoryMock.remove).toHaveBeenCalledWith(scopedUser);
  });
});
