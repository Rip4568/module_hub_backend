import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Driver, DriverStatus } from './entities/driver.entity';
import { UserService } from '../user/user.service';
import { TenantService } from '../tenant/tenant.service';
import { InviteDriverDto } from './dto/invite-driver.dto';
import { CreateUserDto } from '../user/dto/create-user.dto';
import { PaginatedResult } from '../../common/interfaces/paginated-result.interface';
import { normalizePagination } from '../../common/utils/pagination.util';
import { EmailTemplateService } from '../../infrastructure/email/email-template.service';

@Injectable()
export class DriverService {
  constructor(
    @InjectRepository(Driver)
    private driverRepository: Repository<Driver>,
    private userService: UserService,
    private tenantService: TenantService,
    private emailTemplateService: EmailTemplateService,
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
    const tenant = await this.tenantService.findOne(tenantId, tenantId);
    let user = await this.userService.findByEmail(inviteDto.email);
    let isNewUser = false;
    let tempPassword: string | undefined;

    if (!user) {
      isNewUser = true;
      tempPassword = Math.random().toString(36).slice(-8) + 'Aa1!';

      const createUserDto = new CreateUserDto();
      createUserDto.email = inviteDto.email;
      createUserDto.name = inviteDto.name;
      createUserDto.password = tempPassword;
      createUserDto.tenantId = tenantId;

      user = await this.userService.create(createUserDto);
    }

    await this.emailTemplateService.sendDriverInvite({
      to: inviteDto.email,
      name: inviteDto.name,
      tenantName: tenant.name,
      tempPassword,
      isNewUser,
    });

    const existingDriver = await this.driverRepository.findOne({
      where: { userId: user.id, tenantId },
    });

    if (existingDriver) {
      throw new ConflictException('Driver already registered in this company.');
    }

    const driver = this.driverRepository.create({
      userId: user.id,
      tenantId,
      status: DriverStatus.ACTIVE,
      cpf: '00000000000',
    } as unknown as Driver);

    return this.sanitizeDriver(await this.driverRepository.save(driver));
  }

  async createFromUser(userId: string, tenantId: string): Promise<Driver> {
    const existingDriver = await this.driverRepository.findOne({
      where: { userId, tenantId },
    });

    if (existingDriver) {
      return this.sanitizeDriver(existingDriver);
    }

    const driver = this.driverRepository.create({
      userId,
      organizationId: null,
      tenantId,
      status: DriverStatus.PENDING,
      cpf: '00000000000',
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

  async findAll(tenantId: string, page = 1, limit = 20): Promise<PaginatedResult<Driver>> {
    const { page: safePage, limit: safeLimit, skip } = normalizePagination(page, limit);
    const [drivers, total] = await this.driverRepository.findAndCount({
      where: { tenantId },
      relations: ['user'],
      skip,
      take: safeLimit,
      order: { createdAt: 'DESC' },
    });
    const data = drivers.map((driver) => this.sanitizeDriver(driver));
    return {
      data,
      total,
      page: safePage,
      limit: safeLimit,
      totalPages: Math.ceil(total / safeLimit),
    };
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
