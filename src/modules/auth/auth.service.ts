import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '../user/user.service';
import { User } from '../user/entities/user.entity';
import { TenantService } from '../tenant/tenant.service';
import { HashUtils } from '../../common/utils/hash.utils';
import { RegisterDto } from './dto/register.dto';

import { TenantModuleService } from '../tenant-module/tenant-module.service';
import { RoleService } from '../role/role.service';
import { Driver, DriverStatus } from '../driver/entities/driver.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private tenantService: TenantService,
    private tenantModuleService: TenantModuleService,
    private jwtService: JwtService,
    private roleService: RoleService,
    @InjectRepository(Driver)
    private driverRepository: Repository<Driver>,
  ) { }

  async validateUser(email: string, pass: string, tenantId?: string): Promise<Partial<User> | null> {
    let user: User | null = null;

    if (tenantId) {
      user = await this.userService.findByEmailAndTenant(email, tenantId);
    } else {
      // If no tenantId, try to find by email (first match)
      // Ideally we should handle multiple tenants per email, but for now we pick the first one
      user = await this.userService.findByEmail(email);
    }

    if (user && user.password) {
      const isMatch = await HashUtils.compare(pass, user.password);
      if (isMatch) {
        // Populate tenantId if we found the user without it
        // The object already has the property via inheritance, verifying logic is redundant here.

        const { password, ...result } = user;
        return result;
      }
    }

    return null;
  }

  async login(user: Partial<User>) {
    const payload = { email: user.email, sub: user.id, tenantId: user.tenantId };

    const activeModules = await this.tenantModuleService.getActiveModules(user.tenantId || '');

    return {
      token: this.jwtService.sign(payload),
      user: {
        ...user,
      },
      activeModules // Return the list of module IDs
    };
  }

  async register(registerDto: RegisterDto) {
    let adminRole;

    // If tenantName is provided, create a new tenant
    if (registerDto.tenantName) {
      const slug = registerDto.tenantName.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');
      const tenant = await this.tenantService.create({
        name: registerDto.tenantName,
        slug: slug,
        ownerId: 'temp', // Will update later or ignore for now
        config: {}
      });
      registerDto.tenantId = tenant.id;

      // Create Admin Role for the new tenant
      adminRole = await this.roleService.create(tenant.id, {
        name: 'admin_geral',
        displayName: 'Administrator',
        description: 'System Administrator with full access',
        isSystem: true
      });
    }

    if (!registerDto.tenantId) {
      throw new Error('Tenant ID is required if not creating a new one');
    }

    const user = await this.userService.create(registerDto);

    if (adminRole) {
      await this.userService.addRole(user.id, adminRole.id);
    }

    return user;
  }

  async registerDriver(registerDto: RegisterDto) {
    // Basic User creation
    // Note: Drivers might not create a new Token/Tenant, they join an existing one by ID or Invite.
    // Assuming registerDto takes tenantId.

    if (!registerDto.tenantId) {
      throw new Error('Tenant ID is required for driver registration');
    }

    // 1. Create User
    const user = await this.userService.create(registerDto);

    // 2. Create Driver Profile
    const existingDriver = await this.driverRepository.findOne({
      where: { userId: user.id, tenantId: registerDto.tenantId }
    });

    if (!existingDriver) {
      const driver = this.driverRepository.create({
        userId: user.id,
        organizationId: null,
        tenantId: registerDto.tenantId,
        status: DriverStatus.PENDING,
        cpf: '00000000000',
      } as unknown as Driver);

      await this.driverRepository.save(driver);
    }

    return user;
  }
}
