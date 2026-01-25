import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Organization, OrganizationStatus } from './entities/organization.entity';
import { Address } from './entities/address.entity';
import { CreateOrganizationDto, UpdateOrganizationDto } from './dto/create-organization.dto';

@Injectable()
export class OrganizationService {
  constructor(
    @InjectRepository(Organization)
    private organizationRepository: Repository<Organization>,
    @InjectRepository(Address)
    private addressRepository: Repository<Address>,
  ) { }

  async create(tenantId: string, createOrganizationDto: CreateOrganizationDto): Promise<Organization> {
    const organization = this.organizationRepository.create({
      ...(createOrganizationDto as any),
      tenantId,
    });
    const saved = await this.organizationRepository.save(organization);
    return Array.isArray(saved) ? saved[0] : saved;
  }

  async findAll(tenantId: string): Promise<Organization[]> {
    return this.organizationRepository.find({ where: { tenantId } });
  }

  async findOne(tenantId: string, id: string): Promise<Organization> {
    const organization = await this.organizationRepository.findOne({
      where: { id, tenantId },
      relations: ['addresses', 'documents', 'bankAccounts'],
    });

    if (!organization) {
      throw new NotFoundException(`Organization with ID ${id} not found`);
    }

    return organization;
  }

  async update(tenantId: string, id: string, updateOrganizationDto: UpdateOrganizationDto): Promise<Organization> {
    const organization = await this.findOne(tenantId, id);
    this.organizationRepository.merge(organization, updateOrganizationDto);
    const saved = await this.organizationRepository.save(organization);
    return Array.isArray(saved) ? saved[0] : saved;
  }

  async remove(tenantId: string, id: string): Promise<void> {
    const organization = await this.findOne(tenantId, id);
    await this.organizationRepository.remove(organization);
  }

  async approve(tenantId: string, id: string): Promise<Organization> {
    const organization = await this.findOne(tenantId, id);
    organization.status = OrganizationStatus.ACTIVE;
    organization.approvedAt = new Date();
    return this.organizationRepository.save(organization);
  }

  async block(tenantId: string, id: string): Promise<Organization> {
    const organization = await this.findOne(tenantId, id);
    organization.status = OrganizationStatus.BLOCKED;
    return this.organizationRepository.save(organization);
  }
}
