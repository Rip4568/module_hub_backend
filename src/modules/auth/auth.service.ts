import { Injectable, UnauthorizedException, ConflictException, InternalServerErrorException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '../user/user.service';
import { User } from '../user/entities/user.entity';
import { TenantService } from '../tenant/tenant.service';
import { HashUtils } from '../../common/utils/hash.utils';
import { RegisterDto } from './dto/register.dto';
import { ClsService } from 'nestjs-cls';
import { RequestContext } from '../../common/context/request.context';

import { TenantModuleService } from '../tenant-module/tenant-module.service';
import { RoleService } from '../role/role.service';
import { RoleName } from '../role/enums/role-name.enum';
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
    private readonly cls: ClsService,
  ) { }

  async validateUser(email: string, pass: string, tenantId?: string): Promise<Partial<User> | null> {
    let user: User | null = null;
    let contextTenantId = this.cls.get(RequestContext.TENANT_ID);

    if (tenantId) {
      user = await this.userService.findByEmailAndTenant(email, tenantId);
    } else if (contextTenantId) {
      // Also try to use context tenant if specific one not provided
      user = await this.userService.findByEmailAndTenant(email, contextTenantId);
    }

    if (!user) {
      // Fallback: If no tenantId, try to find by email (first match)
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

  async getCurrentUser(userId: string, tenantId?: string) {
    if (!tenantId) {
      throw new UnauthorizedException({
        code: 'TENANT_CONTEXT_REQUIRED',
        message: 'Tenant context is required',
        suggestedAction: 'SELECT_TENANT',
      });
    }

    const user = await this.userService.findOneByTenant(userId, tenantId);
    const { password, ...safeUser } = user;
    const activeModules = await this.tenantModuleService.getActiveModules(tenantId);

    return {
      user: safeUser,
      activeModules,
    };
  }

  async register(registerDto: RegisterDto) {
    try {
      // 1. Check for existing user by email
      const existingUser = await this.userService.findByEmail(registerDto.email);
      if (existingUser) {
        throw new ConflictException('Email already in use');
      }

      let adminRole;

      // If tenantName is provided, create a new tenant
      if (registerDto.tenantName) {
        const slug = registerDto.tenantName.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');

        // 2. Check for existing tenant slug
        const existingTenant = await this.tenantService.findBySlug(slug);
        if (existingTenant) {
          throw new ConflictException('Tenant name already taken');
        }

        const tenant = await this.tenantService.create({
          name: registerDto.tenantName,
          slug: slug,
          ownerId: 'temp',
          config: {}
        });
        registerDto.tenantId = tenant.id;

        // Update CLS context to the new tenant to allow writes in TenantSubscriber
        this.cls.set(RequestContext.TENANT_ID, tenant.id);

        // Create Admin Role for the new tenant
        adminRole = await this.roleService.create(tenant.id, {
          name: RoleName.ADMIN,
          displayName: 'Administrator',
          description: 'System Administrator with full access',
          isSystem: true
        });
      }

      if (!registerDto.tenantId) {
        throw new Error('Tenant ID is required if not creating a new one');
      }

      // Ensure context matches if we just set it or if passed in dto
      if (registerDto.tenantId) {
        this.cls.set(RequestContext.TENANT_ID, registerDto.tenantId);
      }

      const user = await this.userService.create(registerDto);

      if (adminRole) {
        await this.userService.addRole(user.id, adminRole.id);
      }

      return user;
    } catch (e) {
      if (e.code === '23505') { // Postgres duplicate key error code
        throw new ConflictException('Duplicate entry');
      }
      if (e instanceof ConflictException) {
        throw e;
      }
      console.error('Registration Error:', e);
      throw new InternalServerErrorException('Registration failed');
    }
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
