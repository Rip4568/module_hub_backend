import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  InternalServerErrorException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
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
import { DriverService } from '../driver/driver.service';
import { EmailTemplateService } from '../../infrastructure/email/email-template.service';
import { PermissionService } from '../permission/permission.service';

interface TokenPayload {
  email: string;
  sub: string;
  tenantId?: string;
  type?: string;
}

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private tenantService: TenantService,
    private tenantModuleService: TenantModuleService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private roleService: RoleService,
    private driverService: DriverService,
    private readonly cls: ClsService,
    private readonly emailTemplateService: EmailTemplateService,
    private readonly permissionService: PermissionService,
  ) {}

  private toAuthUser(user: User): Record<string, unknown> {
    const primaryRole = user.roles?.[0]?.role;
    const role = primaryRole?.name ?? primaryRole?.displayName ?? 'user';

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role,
      tenantId: user.tenantId,
      avatar: user.avatar ?? undefined,
      phone: user.phone ?? undefined,
    };
  }

  private async resolvePermissionSlugs(userId: string, tenantId: string): Promise<string[]> {
    const permissions = await this.permissionService.getUserPermissions(userId, tenantId);

    if (permissions.includes('*')) {
      const modulePermissions = await this.permissionService.findAll(tenantId);
      return modulePermissions.map((permission) => permission.name);
    }

    return permissions.filter((permission) => permission !== '*');
  }

  private getRefreshSecret(): string {
    const refreshSecret = this.configService.get<string>('JWT_REFRESH_SECRET');
    if (refreshSecret) {
      return refreshSecret;
    }
    if (process.env.NODE_ENV === 'production') {
      throw new Error('JWT_REFRESH_SECRET must be set in production');
    }
    return this.configService.get<string>('JWT_SECRET') || 'dev-refresh-secret';
  }

  async validateUser(email: string, pass: string, tenantId?: string): Promise<Partial<User> | null> {
    let user: User | null = null;
    const contextTenantId = this.cls.get(RequestContext.TENANT_ID);

    if (tenantId) {
      user = await this.userService.findByEmailAndTenant(email, tenantId);
    } else if (contextTenantId) {
      user = await this.userService.findByEmailAndTenant(email, contextTenantId);
    }

    if (user && user.password) {
      const isMatch = await HashUtils.compare(pass, user.password);
      if (isMatch) {
        const { password, ...result } = user;
        return result;
      }
    }

    return null;
  }

  async login(user: Partial<User>, clientIp?: string) {
    if (user.id) {
      await this.userService.updateLastLogin(user.id, clientIp);
    }

    const payload: TokenPayload = { email: user.email!, sub: user.id!, tenantId: user.tenantId };
    const refreshPayload: TokenPayload = { ...payload, type: 'refresh' };

    const activeModules = await this.tenantModuleService.getActiveModules(user.tenantId || '');

    return {
      token: this.jwtService.sign(payload),
      refreshToken: this.jwtService.sign(refreshPayload, {
        secret: this.getRefreshSecret(),
        expiresIn: '7d',
      }),
      user: {
        ...user,
      },
      activeModules,
    };
  }

  async refresh(refreshToken: string) {
    try {
      const payload = this.jwtService.verify<TokenPayload>(refreshToken, {
        secret: this.getRefreshSecret(),
      });

      if (payload.type !== 'refresh') {
        throw new UnauthorizedException('Invalid refresh token');
      }

      const user = await this.userService.findOneEntity(payload.sub);
      const { password, ...safeUser } = user;

      return this.login(safeUser);
    } catch {
      throw new UnauthorizedException({
        code: 'INVALID_REFRESH_TOKEN',
        message: 'Invalid or expired refresh token',
        suggestedAction: 'RETRY_LOGIN',
      });
    }
  }

  async forgotPassword(email: string, tenantId: string): Promise<{ message: string }> {
    const user = await this.userService.findByEmailAndTenant(email, tenantId);

    if (user) {
      const resetToken = this.jwtService.sign(
        { sub: user.id, type: 'password_reset' },
        { expiresIn: '1h' },
      );

      await this.emailTemplateService.sendForgotPassword({
        to: user.email,
        name: user.name,
        resetToken,
      });
    }

    return { message: 'If the email exists, a reset link has been sent' };
  }

  async resetPassword(token: string, newPassword: string): Promise<{ message: string }> {
    try {
      const payload = this.jwtService.verify<TokenPayload>(token);

      if (payload.type !== 'password_reset') {
        throw new BadRequestException('Invalid reset token');
      }

      await this.userService.updatePassword(payload.sub, newPassword);

      return { message: 'Password updated successfully' };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Invalid or expired reset token');
    }
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
    const [activeModules, permissions, tenant] = await Promise.all([
      this.tenantModuleService.getActiveModules(tenantId),
      this.resolvePermissionSlugs(userId, tenantId),
      this.tenantService.findMyTenant(tenantId),
    ]);

    const plan = tenant?.plan ?? null;

    return {
      user: this.toAuthUser(user),
      activeModules,
      permissions,
      plan,
      tenant: tenant
        ? {
            plan,
            name: tenant.name,
          }
        : undefined,
    };
  }

  async register(registerDto: RegisterDto) {
    try {
      const existingUser = await this.userService.findByEmail(registerDto.email);
      if (existingUser) {
        throw new ConflictException('Email already in use');
      }

      let adminRole;

      if (registerDto.tenantName) {
        const slug = registerDto.tenantName.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');

        const existingTenant = await this.tenantService.findBySlug(slug);
        if (existingTenant) {
          throw new ConflictException('Tenant name already taken');
        }

        const tenant = await this.tenantService.create({
          name: registerDto.tenantName,
          slug: slug,
          config: {},
        });
        registerDto.tenantId = tenant.id;

        this.cls.set(RequestContext.TENANT_ID, tenant.id);

        adminRole = await this.roleService.create(tenant.id, {
          name: RoleName.ADMIN,
          displayName: 'Administrator',
          description: 'System Administrator with full access',
          isSystem: true,
        });
      }

      if (!registerDto.tenantId) {
        throw new BadRequestException('Tenant ID is required if not creating a new one');
      }

      if (registerDto.tenantId) {
        this.cls.set(RequestContext.TENANT_ID, registerDto.tenantId);
      }

      const user = await this.userService.create(registerDto);

      if (adminRole) {
        await this.userService.addRole(user.id, adminRole.id);
      }

      return user;
    } catch (e) {
      if (e.code === '23505') {
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
    if (!registerDto.tenantId) {
      throw new BadRequestException('Tenant ID is required for driver registration');
    }

    const user = await this.userService.create(registerDto);
    await this.driverService.createFromUser(user.id, registerDto.tenantId);

    return user;
  }
}
