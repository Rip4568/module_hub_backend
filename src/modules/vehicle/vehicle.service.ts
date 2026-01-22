import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Vehicle, VehicleStatus } from './entities/vehicle.entity';

@Injectable()
export class VehicleService {
  constructor(
    @InjectRepository(Vehicle)
    private vehicleRepository: Repository<Vehicle>,
  ) {}

  async create(tenantId: string, createVehicleDto: any): Promise<Vehicle> {
    const vehicle = this.vehicleRepository.create({
      ...createVehicleDto,
      tenantId,
    } as Vehicle);
    return this.vehicleRepository.save(vehicle);
  }

  async findAll(tenantId: string): Promise<Vehicle[]> {
    return this.vehicleRepository.find({ where: { tenantId } });
  }

  async findOne(tenantId: string, id: string): Promise<Vehicle> {
    const vehicle = await this.vehicleRepository.findOne({ where: { id, tenantId } });
    if (!vehicle) {
      throw new NotFoundException(`Vehicle with ID ${id} not found`);
    }
    return vehicle;
  }

  async update(tenantId: string, id: string, updateVehicleDto: any): Promise<Vehicle> {
    const vehicle = await this.findOne(tenantId, id);
    this.vehicleRepository.merge(vehicle, updateVehicleDto);
    return this.vehicleRepository.save(vehicle);
  }

  async remove(tenantId: string, id: string): Promise<void> {
    const vehicle = await this.findOne(tenantId, id);
    await this.vehicleRepository.remove(vehicle);
  }

  async approve(tenantId: string, id: string): Promise<Vehicle> {
      const vehicle = await this.findOne(tenantId, id);
      // Assuming 'ACTIVE' implies approved in this simple status flow
      vehicle.status = VehicleStatus.ACTIVE;
      return this.vehicleRepository.save(vehicle);
  }

  async setMaintenance(tenantId: string, id: string): Promise<Vehicle> {
      const vehicle = await this.findOne(tenantId, id);
      vehicle.status = VehicleStatus.MAINTENANCE;
      return this.vehicleRepository.save(vehicle);
  }
}
