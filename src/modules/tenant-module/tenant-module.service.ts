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

  async isModuleEnabled(tenantId: string, moduleId: string): Promise<boolean> {
    const tenantModule = await this.tenantModuleRepository.findOne({
      where: { tenantId, moduleId, isActive: true },
    });
    return !!tenantModule;
  }

  async findAll(tenantId: string): Promise<TenantModuleEntity[]> {
    return this.tenantModuleRepository.find({ where: { tenantId } });
  }

  async activateModule(tenantId: string, moduleId: string): Promise<TenantModuleEntity> {
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
    const module = await this.tenantModuleRepository.findOne({ where: { tenantId, moduleId } });
    if (module) {
      module.isActive = false;
      const saved = await this.tenantModuleRepository.save(module);
      return Array.isArray(saved) ? saved[0] : saved;
    }
    return null;
  }
}
