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
  ) { }

  // ... (existing create, findAll, etc.)

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
      where: { userId: user.id, tenantId }
    });

    if (existingDriver) {
      throw new Error('Driver already registered in this company.');
    }

    // 3. Create Driver Profile
    const driver = this.driverRepository.create({
      userId: user.id,
      tenantId,
      status: DriverStatus.ACTIVE, // Drivers invited by company are immediately active per user request.
      cpf: '00000000000', // Placeholder
      // name/email are in User entity
    } as unknown as Driver);

    return this.driverRepository.save(driver);
  }

  async create(tenantId: string, createDriverDto: any): Promise<Driver> {
    const driver = this.driverRepository.create({
      ...createDriverDto,
      tenantId,
    } as Driver);
    return this.driverRepository.save(driver);
  }

  // ... rest of methods

  async findAll(tenantId: string): Promise<Driver[]> {
    return this.driverRepository.find({ where: { tenantId }, relations: ['user'] }); // Include user relation to see names
  }

  async findOne(tenantId: string, id: string): Promise<Driver> {
    const driver = await this.driverRepository.findOne({
      where: { id, tenantId },
      relations: ['user']
    });
    if (!driver) {
      throw new NotFoundException(`Driver with ID ${id} not found`);
    }
    return driver;
  }

  // ... update, remove, approve, block
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
    return this.driverRepository.save(driver);
  }

  async block(tenantId: string, id: string): Promise<Driver> {
    const driver = await this.findOne(tenantId, id);
    driver.status = DriverStatus.BLOCKED;
    return this.driverRepository.save(driver);
  }
}
