import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '../user/user.service';
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

  async validateUser(email: string, pass: string, tenantId: string): Promise<any> {
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

  async login(user: any) {
    const payload = { email: user.email, sub: user.id, tenantId: user.tenantId };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }

  async register(registerDto: RegisterDto) {
    return this.userService.create(registerDto);
  }
}
