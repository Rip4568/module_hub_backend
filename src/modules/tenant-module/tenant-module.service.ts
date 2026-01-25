import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TenantModuleEntity } from './entities/tenant-module.entity';

@Injectable()
export class TenantModuleService {
  constructor(
    @InjectRepository(TenantModuleEntity)
    private tenantModuleRepository: Repository<TenantModuleEntity>,
  ) { }

  // List of modules that cannot be deactivated
  private readonly ESSENTIAL_MODULES = ['tenant', 'auth', 'user', 'role', 'permission', 'tenant-module'];
  private readonly MAX_MODULES_PER_PLAN = 5;

  async isModuleEnabled(tenantId: string, moduleId: string): Promise<boolean> {
    // Essential modules are always enabled conceptually, but we check DB for consistency
    if (this.ESSENTIAL_MODULES.includes(moduleId)) return true;

    const tenantModule = await this.tenantModuleRepository.findOne({
      where: { tenantId, moduleId, isActive: true },
    });
    return !!tenantModule;
  }

  async findAll(tenantId: string): Promise<TenantModuleEntity[]> {
    return this.tenantModuleRepository.find({ where: { tenantId } });
  }

  async activateModule(tenantId: string, moduleId: string): Promise<TenantModuleEntity> {
    // 1. Check Limit
    const activeCount = await this.tenantModuleRepository.count({
      where: { tenantId, isActive: true }
    });

    if (activeCount >= this.MAX_MODULES_PER_PLAN) {
      // Check if module is already active to avoid false positive
      const existing = await this.tenantModuleRepository.findOne({ where: { tenantId, moduleId } });
      if (!existing || !existing.isActive) {
        throw new Error(`Plan limit reached. Max ${this.MAX_MODULES_PER_PLAN} active modules allowed.`);
      }
    }

    let module = await this.tenantModuleRepository.findOne({ where: { tenantId, moduleId } });
    if (module) {
      module.isActive = true;
    } else {
      module = this.tenantModuleRepository.create({
        tenantId,
        moduleId,
        isActive: true,
        activatedAt: new Date()
      } as TenantModuleEntity);
    }
    const saved = await this.tenantModuleRepository.save(module);
    return Array.isArray(saved) ? saved[0] : saved;
  }

  async deactivateModule(tenantId: string, moduleId: string): Promise<TenantModuleEntity | null> {
    // 1. Check Essentials
    if (this.ESSENTIAL_MODULES.includes(moduleId)) {
      throw new Error(`Cannot deactivate essential module: ${moduleId}`);
    }

    const module = await this.tenantModuleRepository.findOne({ where: { tenantId, moduleId } });
    if (module) {
      module.isActive = false;
      const saved = await this.tenantModuleRepository.save(module);
      return Array.isArray(saved) ? saved[0] : saved;
    }
    return null;
  }
}
