import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ClsService } from 'nestjs-cls';
import { TenantGuard } from './tenant.guard';
import { RequestContext } from '../context/request.context';

describe('TenantGuard', () => {
  const reflectorMock = {
    getAllAndOverride: jest.fn(),
  };

  const clsMock = {
    set: jest.fn(),
  };

  const createContext = (request: { user?: { tenantId?: string; userId?: string } }) =>
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

  it('allows public routes', async () => {
    reflectorMock.getAllAndOverride.mockReturnValue(true);
    const guard = new TenantGuard(
      reflectorMock as unknown as Reflector,
      clsMock as unknown as ClsService,
    );

    await expect(guard.canActivate(createContext({}))).resolves.toBe(true);
  });

  it('throws UnauthorizedException when user is missing', async () => {
    reflectorMock.getAllAndOverride.mockReturnValue(false);
    const guard = new TenantGuard(
      reflectorMock as unknown as Reflector,
      clsMock as unknown as ClsService,
    );

    await expect(guard.canActivate(createContext({}))).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('throws ForbiddenException when tenant id is missing in user payload', async () => {
    reflectorMock.getAllAndOverride.mockReturnValue(false);
    const guard = new TenantGuard(
      reflectorMock as unknown as Reflector,
      clsMock as unknown as ClsService,
    );

    await expect(
      guard.canActivate(createContext({ user: { userId: 'user-1' } })),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('stores tenant and user ids in CLS when payload is valid', async () => {
    reflectorMock.getAllAndOverride.mockReturnValue(false);
    const guard = new TenantGuard(
      reflectorMock as unknown as Reflector,
      clsMock as unknown as ClsService,
    );

    await expect(
      guard.canActivate(createContext({ user: { userId: 'user-1', tenantId: 'tenant-1' } })),
    ).resolves.toBe(true);

    expect(clsMock.set).toHaveBeenCalledWith(RequestContext.TENANT_ID, 'tenant-1');
    expect(clsMock.set).toHaveBeenCalledWith(RequestContext.USER_ID, 'user-1');
  });
});
