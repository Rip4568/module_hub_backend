import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '../user/user.service';
import { User } from '../user/entities/user.entity';
import { TenantService } from '../tenant/tenant.service';
import { HashUtils } from '../../common/utils/hash.utils';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private tenantService: TenantService,
    private jwtService: JwtService,
  ) { }

  async validateUser(email: string, pass: string, tenantId: string): Promise<Partial<User> | null> {
    const user = await this.userService.findByEmailAndTenant(email, tenantId);

    if (user && user.password) {
      const isMatch = await HashUtils.compare(pass, user.password);
      if (isMatch) {
        const { password, ...result } = user;
        return result;
      }
    }

    return null;
  }

  async login(user: Partial<User>) {
    const payload = { email: user.email, sub: user.id, tenantId: user.tenantId };
    return {
      access_token: this.jwtService.sign(payload),
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
