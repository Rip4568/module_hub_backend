import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '../user/user.service';
import { User } from '../user/entities/user.entity';
import { TenantService } from '../tenant/tenant.service';
import { HashUtils } from '../../common/utils/hash.utils';
import { RegisterDto } from './dto/register.dto';

import { TenantModuleService } from '../tenant-module/tenant-module.service';

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private tenantService: TenantService,
    private tenantModuleService: TenantModuleService,
    private jwtService: JwtService,
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
        if (!user.tenantId && user['tenantId']) user.tenantId = user['tenantId'];

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
    }

    if (!registerDto.tenantId) {
      throw new Error('Tenant ID is required if not creating a new one');
    }

    return this.userService.create(registerDto);
  }
}
