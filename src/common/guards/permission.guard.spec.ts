import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PermissionGuard } from './permission.guard';
import { PermissionService } from '../../modules/permission/permission.service';

describe('PermissionGuard', () => {
  const reflectorMock = {
    getAllAndOverride: jest.fn(),
    get: jest.fn(),
  };

  const permissionServiceMock = {
    userHasPermissions: jest.fn(),
  };

  const createContext = (request: { user?: { userId?: string; tenantId?: string } }) =>
    ({
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue(request),
      }),
    }) as any;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('allows public route', async () => {
    reflectorMock.getAllAndOverride.mockReturnValue(true);
    const guard = new PermissionGuard(
      reflectorMock as unknown as Reflector,
      permissionServiceMock as unknown as PermissionService,
    );

    await expect(guard.canActivate(createContext({}))).resolves.toBe(true);
  });

  it('allows route with no permission metadata', async () => {
    reflectorMock.getAllAndOverride.mockReturnValue(false);
    reflectorMock.get.mockReturnValue(undefined);
    const guard = new PermissionGuard(
      reflectorMock as unknown as Reflector,
      permissionServiceMock as unknown as PermissionService,
    );

    await expect(
      guard.canActivate(createContext({ user: { userId: 'u1', tenantId: 't1' } })),
    ).resolves.toBe(true);
  });

  it('throws UnauthorizedException when user is missing', async () => {
    reflectorMock.getAllAndOverride.mockReturnValue(false);
    reflectorMock.get.mockReturnValue(['perm.read']);
    const guard = new PermissionGuard(
      reflectorMock as unknown as Reflector,
      permissionServiceMock as unknown as PermissionService,
    );

    await expect(guard.canActivate(createContext({}))).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('throws ForbiddenException when tenant context is missing', async () => {
    reflectorMock.getAllAndOverride.mockReturnValue(false);
    reflectorMock.get.mockReturnValue(['perm.read']);
    const guard = new PermissionGuard(
      reflectorMock as unknown as Reflector,
      permissionServiceMock as unknown as PermissionService,
    );

    await expect(
      guard.canActivate(createContext({ user: { userId: 'u1' } })),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('delegates permission check to PermissionService', async () => {
    reflectorMock.getAllAndOverride.mockReturnValue(false);
    reflectorMock.get.mockReturnValue(['perm.read']);
    permissionServiceMock.userHasPermissions.mockResolvedValue(true);
    const guard = new PermissionGuard(
      reflectorMock as unknown as Reflector,
      permissionServiceMock as unknown as PermissionService,
    );

    await expect(
      guard.canActivate(createContext({ user: { userId: 'u1', tenantId: 't1' } })),
    ).resolves.toBe(true);
    expect(permissionServiceMock.userHasPermissions).toHaveBeenCalledWith('u1', 't1', [
      'perm.read',
    ]);
  });

  it('throws ForbiddenException when user lacks required permission', async () => {
    reflectorMock.getAllAndOverride.mockReturnValue(false);
    reflectorMock.get.mockReturnValue(['perm.read']);
    permissionServiceMock.userHasPermissions.mockResolvedValue(false);
    const guard = new PermissionGuard(
      reflectorMock as unknown as Reflector,
      permissionServiceMock as unknown as PermissionService,
    );

    await expect(
      guard.canActivate(createContext({ user: { userId: 'u1', tenantId: 't1' } })),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});
