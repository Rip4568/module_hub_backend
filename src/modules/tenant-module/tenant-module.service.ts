import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TenantModuleEntity } from './entities/tenant-module.entity';

@Injectable()
export class TenantModuleService {
  constructor(
    @InjectRepository(TenantModuleEntity)
    private tenantModuleRepository: Repository<TenantModuleEntity>,
  ) {}

  async isModuleEnabled(tenantId: string, moduleId: string): Promise<boolean> {
    const tenantModule = await this.tenantModuleRepository.findOne({
      where: { tenantId, moduleId, isActive: true },
    });
    return !!tenantModule;
  }
}
