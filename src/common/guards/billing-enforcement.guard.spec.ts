import { ExecutionContext, ForbiddenException, HttpException, HttpStatus } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ClsService } from 'nestjs-cls';
import { BillingEnforcementGuard } from './billing-enforcement.guard';
import { TenantService } from '../../modules/tenant/tenant.service';
import { RequestContext } from '../context/request.context';
import { SKIP_BILLING_CHECK_KEY } from '../decorators/skip-billing-check.decorator';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { TenantStatus } from '../../modules/tenant/entities/tenant.entity';

describe('BillingEnforcementGuard', () => {
  const reflectorMock = {
    getAllAndOverride: jest.fn(),
  };

  const clsMock = {
    get: jest.fn(),
  };

  const tenantServiceMock = {
    findMyTenant: jest.fn(),
  };

  const createContext = (): ExecutionContext =>
    ({
      getHandler: jest.fn(),
      getClass: jest.fn(),
    }) as unknown as ExecutionContext;

  let guard: BillingEnforcementGuard;

  beforeEach(() => {
    jest.clearAllMocks();
    guard = new BillingEnforcementGuard(
      reflectorMock as unknown as Reflector,
      clsMock as unknown as ClsService,
      tenantServiceMock as unknown as TenantService,
    );
  });

  it('allows access when billing check is skipped', async () => {
    reflectorMock.getAllAndOverride.mockImplementation((key: string) =>
      key === SKIP_BILLING_CHECK_KEY ? true : false,
    );

    await expect(guard.canActivate(createContext())).resolves.toBe(true);
    expect(tenantServiceMock.findMyTenant).not.toHaveBeenCalled();
  });

  it('allows access for public routes', async () => {
    reflectorMock.getAllAndOverride.mockImplementation((key: string) =>
      key === IS_PUBLIC_KEY ? true : false,
    );

    await expect(guard.canActivate(createContext())).resolves.toBe(true);
    expect(tenantServiceMock.findMyTenant).not.toHaveBeenCalled();
  });

  it('allows access when tenant context is missing', async () => {
    reflectorMock.getAllAndOverride.mockReturnValue(false);
    clsMock.get.mockReturnValue(undefined);

    await expect(guard.canActivate(createContext())).resolves.toBe(true);
  });

  it('allows access when tenant is not found', async () => {
    reflectorMock.getAllAndOverride.mockReturnValue(false);
    clsMock.get.mockReturnValue('tenant-1');
    tenantServiceMock.findMyTenant.mockResolvedValue(null);

    await expect(guard.canActivate(createContext())).resolves.toBe(true);
  });

  it('throws ForbiddenException when tenant is suspended', async () => {
    reflectorMock.getAllAndOverride.mockReturnValue(false);
    clsMock.get.mockImplementation((key: string) =>
      key === RequestContext.TENANT_ID ? 'tenant-1' : undefined,
    );
    tenantServiceMock.findMyTenant.mockResolvedValue({
      id: 'tenant-1',
      status: TenantStatus.SUSPENDED,
    });

    await expect(guard.canActivate(createContext())).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('throws PAYMENT_REQUIRED when trial has expired', async () => {
    reflectorMock.getAllAndOverride.mockReturnValue(false);
    clsMock.get.mockReturnValue('tenant-1');
    tenantServiceMock.findMyTenant.mockResolvedValue({
      id: 'tenant-1',
      status: TenantStatus.TRIAL,
      trialEndsAt: new Date('2020-01-01'),
    });

    try {
      await guard.canActivate(createContext());
      fail('Expected guard to throw');
    } catch (error) {
      const exception = error as HttpException;
      expect(exception.getStatus()).toBe(HttpStatus.PAYMENT_REQUIRED);
      expect(exception.getResponse()).toMatchObject({ code: 'TRIAL_EXPIRED' });
    }
  });

  it('allows access for active tenant within trial period', async () => {
    reflectorMock.getAllAndOverride.mockReturnValue(false);
    clsMock.get.mockReturnValue('tenant-1');
    tenantServiceMock.findMyTenant.mockResolvedValue({
      id: 'tenant-1',
      status: TenantStatus.ACTIVE,
      trialEndsAt: new Date(Date.now() + 86400000),
    });

    await expect(guard.canActivate(createContext())).resolves.toBe(true);
  });
});
