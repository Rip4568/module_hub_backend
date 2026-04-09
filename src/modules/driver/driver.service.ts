import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Driver, DriverStatus } from './entities/driver.entity';
import { UserService } from '../user/user.service';
import { InviteDriverDto } from './dto/invite-driver.dto';
import { CreateUserDto } from '../user/dto/create-user.dto';

@Injectable()
export class DriverService {
  constructor(
    @InjectRepository(Driver)
    private driverRepository: Repository<Driver>,
    private userService: UserService,
  ) {}

  private normalizeStatus(status?: string | null): DriverStatus {
    const normalizedStatus = String(status ?? '').toUpperCase();
    if (normalizedStatus === DriverStatus.ACTIVE) return DriverStatus.ACTIVE;
    if (normalizedStatus === DriverStatus.BLOCKED) return DriverStatus.BLOCKED;
    if (normalizedStatus === DriverStatus.INACTIVE) return DriverStatus.INACTIVE;
    return DriverStatus.PENDING;
  }

  private sanitizeDriver(driver: Driver): Driver {
    return {
      ...driver,
      status: this.normalizeStatus(driver.status),
    };
  }

  async invite(tenantId: string, inviteDto: InviteDriverDto): Promise<Driver> {
    // 1. Check if user exists
    let user = await this.userService.findByEmail(inviteDto.email);
    let isNewUser = false;

    if (!user) {
      // Scenario A: New User
      isNewUser = true;
      // Create user with random password (or handled by user service if it supports it)
      // For now generating a random password placeholder.
      // In real app, we should trigger a "Welcome/Reset Password" email flow.
      const tempPassword = Math.random().toString(36).slice(-8) + 'Aa1!';

      const createUserDto = new CreateUserDto();
      createUserDto.email = inviteDto.email;
      createUserDto.name = inviteDto.name;
      createUserDto.password = tempPassword;
      createUserDto.tenantId = tenantId; // Initial tenant context

      user = await this.userService.create(createUserDto);
      console.log(`[MOCK EMAIL] Welcome ${user.email}. Password: ${tempPassword}`);
    } else {
      console.log(`[MOCK EMAIL] Inverse: You have been invited to join tenant ${tenantId}`);
    }

    // 2. Check if driver profile exists for this tenant
    const existingDriver = await this.driverRepository.findOne({
      where: { userId: user.id, tenantId },
    });

    if (existingDriver) {
      throw new Error('Driver already registered in this company.');
    }

    // 3. Create Driver Profile
    const driver = this.driverRepository.create({
      userId: user.id,
      tenantId,
      status: DriverStatus.ACTIVE,
      cpf: '00000000000', // Placeholder
      // name/email are in User entity
    } as unknown as Driver);

    return this.sanitizeDriver(await this.driverRepository.save(driver));
  }

  async create(tenantId: string, createDriverDto: any): Promise<Driver> {
    const driver = this.driverRepository.create({
      ...createDriverDto,
      tenantId,
      status: this.normalizeStatus(createDriverDto?.status),
    } as Driver);
    return this.sanitizeDriver(await this.driverRepository.save(driver));
  }

  // ... rest of methods

  async findAll(tenantId: string): Promise<Driver[]> {
    const drivers = await this.driverRepository.find({ where: { tenantId }, relations: ['user'] });
    return drivers.map((driver) => this.sanitizeDriver(driver));
  }

  async findOne(tenantId: string, id: string): Promise<Driver> {
    const driver = await this.driverRepository.findOne({
      where: { id, tenantId },
      relations: ['user'],
    });
    if (!driver) {
      throw new NotFoundException(`Driver with ID ${id} not found`);
    }
    return this.sanitizeDriver(driver);
  }

  // ... update, remove, approve, block
  async update(tenantId: string, id: string, updateDriverDto: any): Promise<Driver> {
    const driver = await this.findOne(tenantId, id);
    const payload = { ...updateDriverDto };

    if ('status' in payload) {
      payload.status = this.normalizeStatus(payload.status);
    }

    this.driverRepository.merge(driver, payload);
    return this.sanitizeDriver(await this.driverRepository.save(driver));
  }

  async remove(tenantId: string, id: string): Promise<void> {
    const driver = await this.findOne(tenantId, id);
    await this.driverRepository.remove(driver);
  }

  async approve(tenantId: string, id: string): Promise<Driver> {
    const driver = await this.findOne(tenantId, id);
    driver.status = DriverStatus.ACTIVE;
    driver.approvedAt = new Date();
    return this.sanitizeDriver(await this.driverRepository.save(driver));
  }

  async block(tenantId: string, id: string): Promise<Driver> {
    const driver = await this.findOne(tenantId, id);
    driver.status = DriverStatus.BLOCKED;
    return this.sanitizeDriver(await this.driverRepository.save(driver));
  }
}
