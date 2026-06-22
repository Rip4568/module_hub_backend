import { NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { PlanService } from './plan.service';
import { Plan } from './entities/plan.entity';
import { Tenant } from '../tenant/entities/tenant.entity';

describe('PlanService', () => {
  let service: PlanService;

  const planRepositoryMock = {
    find: jest.fn(),
    findOne: jest.fn(),
  };

  const tenantRepositoryMock = {
    findOne: jest.fn(),
  };

  const plans: Plan[] = [
    {
      id: 'starter',
      name: 'Starter',
      priceCents: 0,
      currency: 'BRL',
      maxBillableModules: 5,
      isContactOnly: false,
      sortOrder: 1,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'profissional',
      name: 'Profissional',
      priceCents: 2590,
      currency: 'BRL',
      maxBillableModules: 10,
      isContactOnly: false,
      sortOrder: 2,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'ceo',
      name: 'CEO',
      priceCents: 7990,
      currency: 'BRL',
      maxBillableModules: 20,
      isContactOnly: false,
      sortOrder: 3,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      priceCents: null,
      currency: 'BRL',
      maxBillableModules: null,
      isContactOnly: true,
      sortOrder: 4,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    service = new PlanService(
      planRepositoryMock as unknown as Repository<Plan>,
      tenantRepositoryMock as unknown as Repository<Tenant>,
    );
  });

  it('returns active plans ordered for public listing', async () => {
    planRepositoryMock.find.mockResolvedValue(plans);

    const result = await service.findAll();

    expect(result).toEqual(plans);
    expect(planRepositoryMock.find).toHaveBeenCalledWith({
      where: { isActive: true },
      order: { sortOrder: 'ASC' },
    });
  });

  it('resolves module limits per tier', async () => {
    planRepositoryMock.findOne.mockImplementation(async ({ where }: { where: { id: string } }) =>
      plans.find((plan) => plan.id === where.id),
    );

    await expect(service.getModuleLimitForPlan('starter')).resolves.toBe(5);
    await expect(service.getModuleLimitForPlan('profissional')).resolves.toBe(10);
    await expect(service.getModuleLimitForPlan('ceo')).resolves.toBe(20);
    await expect(service.getModuleLimitForPlan('enterprise')).resolves.toBeNull();
  });

  it('resolves tenant plan limits from tenant.plan', async () => {
    tenantRepositoryMock.findOne.mockResolvedValue({ id: 'tenant-1', plan: 'ceo' });
    planRepositoryMock.findOne.mockResolvedValue(plans[2]);

    await expect(service.getModuleLimitForTenant('tenant-1')).resolves.toBe(20);
  });

  it('defaults to starter limit when plan is missing', async () => {
    tenantRepositoryMock.findOne.mockResolvedValue({ id: 'tenant-1', plan: null });
    planRepositoryMock.findOne.mockResolvedValue(plans[0]);

    await expect(service.getModuleLimitForTenant('tenant-1')).resolves.toBe(5);
  });

  it('throws when plan id does not exist in getPlanById', async () => {
    planRepositoryMock.findOne.mockResolvedValue(null);

    await expect(service.getPlanById('unknown')).rejects.toBeInstanceOf(NotFoundException);
  });
});
