import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Plan } from './entities/plan.entity';
import { Tenant } from '../tenant/entities/tenant.entity';
import { STARTER_PLAN_MODULE_LIMIT } from '../../common/constants/module-billing.constants';

const DEFAULT_PLAN_ID = 'starter';

@Injectable()
export class PlanService {
  constructor(
    @InjectRepository(Plan)
    private readonly planRepository: Repository<Plan>,
    @InjectRepository(Tenant)
    private readonly tenantRepository: Repository<Tenant>,
  ) {}

  async findAll(): Promise<Plan[]> {
    return this.planRepository.find({
      where: { isActive: true },
      order: { sortOrder: 'ASC' },
    });
  }

  async getPlanById(id: string): Promise<Plan> {
    const plan = await this.planRepository.findOne({ where: { id } });
    if (!plan) {
      throw new NotFoundException(`Plano "${id}" não encontrado`);
    }
    return plan;
  }

  async getModuleLimitForPlan(planId: string): Promise<number | null> {
    const plan = await this.planRepository.findOne({ where: { id: planId } });
    if (!plan) {
      return STARTER_PLAN_MODULE_LIMIT;
    }
    return plan.maxBillableModules;
  }

  async getModuleLimitForTenant(tenantId: string): Promise<number | null> {
    const tenant = await this.tenantRepository.findOne({ where: { id: tenantId } });
    const planId = tenant?.plan ?? DEFAULT_PLAN_ID;
    return this.getModuleLimitForPlan(planId);
  }

  async getPlanForTenant(tenantId: string): Promise<Plan | null> {
    const tenant = await this.tenantRepository.findOne({ where: { id: tenantId } });
    const planId = tenant?.plan ?? DEFAULT_PLAN_ID;
    return this.planRepository.findOne({ where: { id: planId } });
  }
}
