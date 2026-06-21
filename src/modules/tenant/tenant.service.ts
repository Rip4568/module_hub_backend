import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tenant } from './entities/tenant.entity';
import { TenantBranding, TenantConfig } from './interfaces/tenant-config.interface';

@Injectable()
export class TenantService {
  constructor(
    @InjectRepository(Tenant)
    private tenantRepository: Repository<Tenant>,
  ) { }

  async create(createTenantDto: any): Promise<Tenant> {
    const tenant = this.tenantRepository.create(createTenantDto as unknown as Tenant);
    return this.tenantRepository.save(tenant);
  }

  async findMyTenant(tenantId: string): Promise<Tenant | null> {
    return this.tenantRepository.findOne({ where: { id: tenantId } });
  }

  async findOne(id: string, tenantId?: string): Promise<Tenant> {
    const where: any = { id };
    if (tenantId) {
      where.id = tenantId;
    }
    const tenant = await this.tenantRepository.findOne({ where });
    if (!tenant) {
      throw new NotFoundException(`Tenant with ID ${id} not found`);
    }
    return tenant;
  }

  async findBySlug(slug: string): Promise<Tenant | null> {
    return this.tenantRepository.findOne({ where: { slug } });
  }

  async updateConfig(
    id: string,
    tenantId: string,
    data: { config?: Partial<TenantConfig>; branding?: Partial<TenantBranding> },
  ): Promise<Tenant> {
    const tenant = await this.findOne(id, tenantId);

    if (data.config !== undefined) {
      tenant.config = { ...(tenant.config || {}), ...data.config };
    }
    if (data.branding !== undefined) {
      tenant.branding = { ...(tenant.branding || {}), ...data.branding };
    }

    return this.tenantRepository.save(tenant);
  }
}
