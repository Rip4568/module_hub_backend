import { BadRequestException, ConflictException } from '@nestjs/common';
import { OnboardingService } from './onboarding.service';
import { TenantService } from '../tenant/tenant.service';
import { TenantModuleService } from '../tenant-module/tenant-module.service';
import { PlanService } from '../plan/plan.service';

describe('OnboardingService', () => {
  let service: OnboardingService;

  const tenantServiceMock = {
    findOne: jest.fn(),
    updateConfig: jest.fn(),
  };

  const tenantModuleServiceMock = {
    getModuleUsageForTenant: jest.fn(),
    activateModule: jest.fn(),
    getActiveModules: jest.fn(),
  };

  const planServiceMock = {
    getPlanForTenant: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    service = new OnboardingService(
      tenantServiceMock as unknown as TenantService,
      tenantModuleServiceMock as unknown as TenantModuleService,
      planServiceMock as unknown as PlanService,
    );
  });

  it('returns onboarding status with suggested modules', async () => {
    tenantServiceMock.findOne.mockResolvedValue({
      id: 'tenant-1',
      config: { onboardingCompleted: false },
    });
    tenantModuleServiceMock.getModuleUsageForTenant.mockResolvedValue({
      billableActiveCount: 0,
      maxModules: 5,
      isAtLimit: false,
    });

    const status = await service.getStatus('tenant-1');

    expect(status.onboardingCompleted).toBe(false);
    expect(status.billableCount).toBe(0);
    expect(status.requiredModuleCount).toBe(1);
    expect(status.suggestedModules).toHaveLength(4);
    expect(status.suggestedModules.map((module) => module.id)).toEqual([
      'ecommerce',
      'order_management',
      'inventory',
      'fleet_management',
    ]);
  });

  it('requires exactly one module on complete', async () => {
    tenantServiceMock.findOne.mockResolvedValue({
      id: 'tenant-1',
      config: { onboardingCompleted: false },
    });

    await expect(
      service.complete('tenant-1', { moduleIds: ['ecommerce', 'inventory'] }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects completion when onboarding is already done', async () => {
    tenantServiceMock.findOne.mockResolvedValue({
      id: 'tenant-1',
      config: { onboardingCompleted: true },
    });

    await expect(
      service.complete('tenant-1', { moduleId: 'ecommerce' }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('activates selected module and marks onboarding complete', async () => {
    tenantServiceMock.findOne.mockResolvedValue({
      id: 'tenant-1',
      config: { onboardingCompleted: false },
    });
    tenantModuleServiceMock.getModuleUsageForTenant.mockResolvedValue({
      billableActiveCount: 0,
      maxModules: 5,
      isAtLimit: false,
    });
    tenantModuleServiceMock.activateModule.mockResolvedValue({
      moduleId: 'ecommerce',
      isActive: true,
    });
    tenantModuleServiceMock.getActiveModules.mockResolvedValue([
      'erp',
      'tenant',
      'ecommerce',
    ]);
    tenantServiceMock.updateConfig.mockResolvedValue({});

    const result = await service.complete('tenant-1', { moduleId: 'ecommerce' });

    expect(tenantModuleServiceMock.activateModule).toHaveBeenCalledWith('tenant-1', 'ecommerce');
    expect(tenantServiceMock.updateConfig).toHaveBeenCalledWith('tenant-1', 'tenant-1', {
      config: { onboardingCompleted: true },
    });
    expect(result).toEqual({
      onboardingCompleted: true,
      activeModules: ['erp', 'tenant', 'ecommerce'],
    });
  });

  it('rejects modules outside the suggested list', async () => {
    tenantServiceMock.findOne.mockResolvedValue({
      id: 'tenant-1',
      config: { onboardingCompleted: false },
    });

    await expect(
      service.complete('tenant-1', { moduleId: 'financial' }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
