import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Driver, DriverStatus } from './entities/driver.entity';

@Injectable()
export class DriverService {
  constructor(
    @InjectRepository(Driver)
    private driverRepository: Repository<Driver>,
  ) {}

  async create(tenantId: string, createDriverDto: any): Promise<Driver> {
    const driver = this.driverRepository.create({
      ...createDriverDto,
      tenantId,
    } as Driver);
    return this.driverRepository.save(driver);
  }

  async findAll(tenantId: string): Promise<Driver[]> {
    return this.driverRepository.find({ where: { tenantId } });
  }

  async findOne(tenantId: string, id: string): Promise<Driver> {
    const driver = await this.driverRepository.findOne({ where: { id, tenantId } });
    if (!driver) {
      throw new NotFoundException(`Driver with ID ${id} not found`);
    }
    return driver;
  }

  async update(tenantId: string, id: string, updateDriverDto: any): Promise<Driver> {
    const driver = await this.findOne(tenantId, id);
    this.driverRepository.merge(driver, updateDriverDto);
    return this.driverRepository.save(driver);
  }

  async remove(tenantId: string, id: string): Promise<void> {
    const driver = await this.findOne(tenantId, id);
    await this.driverRepository.remove(driver);
  }

  async approve(tenantId: string, id: string): Promise<Driver> {
      const driver = await this.findOne(tenantId, id);
      driver.status = DriverStatus.ACTIVE;
      driver.approvedAt = new Date();
      // driver.approvedBy = currentUserId; // In real implementation pass current user
      return this.driverRepository.save(driver);
  }

  async block(tenantId: string, id: string): Promise<Driver> {
      const driver = await this.findOne(tenantId, id);
      driver.status = DriverStatus.BLOCKED;
      return this.driverRepository.save(driver);
  }
}
