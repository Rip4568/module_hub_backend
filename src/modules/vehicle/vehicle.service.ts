import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Vehicle, VehicleStatus, VehicleType, FuelType } from './entities/vehicle.entity';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { PaginatedResult } from '../../common/interfaces/paginated-result.interface';
import { normalizePagination } from '../../common/utils/pagination.util';

@Injectable()
export class VehicleService {
  constructor(
    @InjectRepository(Vehicle)
    private vehicleRepository: Repository<Vehicle>,
  ) {}

  async create(tenantId: string, createVehicleDto: CreateVehicleDto): Promise<Vehicle> {
    const vehicle = this.vehicleRepository.create({
      ...createVehicleDto,
      tenantId,
      type: createVehicleDto.type ?? VehicleType.CAR,
      fuelType: createVehicleDto.fuelType ?? FuelType.GASOLINE,
    } as Vehicle);
    return this.vehicleRepository.save(vehicle);
  }

  async findAll(tenantId: string, page = 1, limit = 20): Promise<PaginatedResult<Vehicle>> {
    const { page: safePage, limit: safeLimit, skip } = normalizePagination(page, limit);
    const [data, total] = await this.vehicleRepository.findAndCount({
      where: { tenantId },
      skip,
      take: safeLimit,
      order: { createdAt: 'DESC' },
    });
    return {
      data,
      total,
      page: safePage,
      limit: safeLimit,
      totalPages: Math.ceil(total / safeLimit),
    };
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
      vehicle.status = vehicle.status === VehicleStatus.MAINTENANCE
        ? VehicleStatus.ACTIVE
        : VehicleStatus.MAINTENANCE;
      return this.vehicleRepository.save(vehicle);
  }
}
