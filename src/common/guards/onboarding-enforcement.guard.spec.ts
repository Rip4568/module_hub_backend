import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ClsService } from 'nestjs-cls';
import { OnboardingEnforcementGuard } from './onboarding-enforcement.guard';
import { TenantService } from '../../modules/tenant/tenant.service';
import { RequestContext } from '../context/request.context';
import { SKIP_ONBOARDING_CHECK_KEY } from '../decorators/skip-onboarding-check.decorator';
import { ALLOW_DURING_ONBOARDING_KEY } from '../decorators/allow-during-onboarding.decorator';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

describe('OnboardingEnforcementGuard', () => {
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

  let guard: OnboardingEnforcementGuard;

  beforeEach(() => {
    jest.clearAllMocks();
    guard = new OnboardingEnforcementGuard(
      reflectorMock as unknown as Reflector,
      clsMock as unknown as ClsService,
      tenantServiceMock as unknown as TenantService,
    );
  });

  it('allows access when onboarding check is skipped', async () => {
    reflectorMock.getAllAndOverride.mockImplementation((key: string) =>
      key === SKIP_ONBOARDING_CHECK_KEY ? true : false,
    );

    await expect(guard.canActivate(createContext())).resolves.toBe(true);
    expect(tenantServiceMock.findMyTenant).not.toHaveBeenCalled();
  });

  it('allows access when route is marked allowDuringOnboarding', async () => {
    reflectorMock.getAllAndOverride.mockImplementation((key: string) =>
      key === ALLOW_DURING_ONBOARDING_KEY ? true : false,
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

  it('allows access when onboarding is completed', async () => {
    reflectorMock.getAllAndOverride.mockReturnValue(false);
    clsMock.get.mockReturnValue('tenant-1');
    tenantServiceMock.findMyTenant.mockResolvedValue({
      id: 'tenant-1',
      config: { onboardingCompleted: true },
    });

    await expect(guard.canActivate(createContext())).resolves.toBe(true);
  });

  it('throws ONBOARDING_REQUIRED when onboarding is incomplete', async () => {
    reflectorMock.getAllAndOverride.mockReturnValue(false);
    clsMock.get.mockImplementation((key: string) =>
      key === RequestContext.TENANT_ID ? 'tenant-1' : undefined,
    );
    tenantServiceMock.findMyTenant.mockResolvedValue({
      id: 'tenant-1',
      config: { onboardingCompleted: false },
    });

    try {
      await guard.canActivate(createContext());
      fail('Expected guard to throw');
    } catch (error) {
      const exception = error as ForbiddenException;
      expect(exception.getResponse()).toMatchObject({
        code: 'ONBOARDING_REQUIRED',
        suggestedAction: 'COMPLETE_ONBOARDING',
      });
    }
  });

  it('treats missing onboardingCompleted flag as incomplete', async () => {
    reflectorMock.getAllAndOverride.mockReturnValue(false);
    clsMock.get.mockReturnValue('tenant-1');
    tenantServiceMock.findMyTenant.mockResolvedValue({
      id: 'tenant-1',
      config: {},
    });

    await expect(guard.canActivate(createContext())).rejects.toBeInstanceOf(ForbiddenException);
  });
});
