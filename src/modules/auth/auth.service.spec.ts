import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { ClsService } from 'nestjs-cls';
import { AuthService } from './auth.service';
import { UserService } from '../user/user.service';
import { TenantService } from '../tenant/tenant.service';
import { TenantModuleService } from '../tenant-module/tenant-module.service';
import { RoleService } from '../role/role.service';
import { Driver } from '../driver/entities/driver.entity';
import { RequestContext } from '../../common/context/request.context';
import { EmailTemplateService } from '../../infrastructure/email/email-template.service';

describe('AuthService', () => {
  let service: AuthService;

  const userServiceMock = {
    findByEmail: jest.fn(),
    findOneByTenant: jest.fn(),
    findOneEntity: jest.fn(),
    create: jest.fn(),
    addRole: jest.fn(),
    updateLastLogin: jest.fn(),
    updatePassword: jest.fn(),
  };

  const tenantServiceMock = {
    findBySlug: jest.fn(),
    create: jest.fn(),
  };

  const tenantModuleServiceMock = {
    getActiveModules: jest.fn(),
  };

  const jwtServiceMock = {
    sign: jest.fn(),
    verify: jest.fn(),
  };

  const configServiceMock = {
    get: jest.fn((key: string) => (key === 'JWT_SECRET' ? 'test-secret' : undefined)),
  };

  const roleServiceMock = {
    create: jest.fn(),
  };

  const driverRepositoryMock = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  const clsMock = {
    get: jest.fn(),
    set: jest.fn(),
  };

  const emailTemplateServiceMock = {
    sendForgotPassword: jest.fn(),
    sendDriverInvite: jest.fn(),
    sendUserInvite: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UserService, useValue: userServiceMock },
        { provide: TenantService, useValue: tenantServiceMock },
        { provide: TenantModuleService, useValue: tenantModuleServiceMock },
        { provide: JwtService, useValue: jwtServiceMock },
        { provide: ConfigService, useValue: configServiceMock },
        { provide: RoleService, useValue: roleServiceMock },
        { provide: ClsService, useValue: clsMock },
        { provide: getRepositoryToken(Driver), useValue: driverRepositoryMock },
        { provide: EmailTemplateService, useValue: emailTemplateServiceMock },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('throws when tenant context is missing in getCurrentUser', async () => {
    await expect(service.getCurrentUser('user-1')).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('returns sanitized user and active modules in getCurrentUser', async () => {
    userServiceMock.findOneByTenant.mockResolvedValue({
      id: 'user-1',
      email: 'admin@tenant.com',
      tenantId: 'tenant-1',
    });
    tenantModuleServiceMock.getActiveModules.mockResolvedValue(['erp', 'delivery']);

    const result = await service.getCurrentUser('user-1', 'tenant-1');

    expect(result.user).toEqual({
      id: 'user-1',
      email: 'admin@tenant.com',
      tenantId: 'tenant-1',
    });
    expect(result.activeModules).toEqual(['erp', 'delivery']);
  });

  it('issues access and refresh tokens on login', async () => {
    jwtServiceMock.sign
      .mockReturnValueOnce('access-token')
      .mockReturnValueOnce('refresh-token');
    tenantModuleServiceMock.getActiveModules.mockResolvedValue(['erp']);
    userServiceMock.updateLastLogin.mockResolvedValue(undefined);

    const result = await service.login(
      { id: 'user-1', email: 'admin@tenant.com', tenantId: 'tenant-1' },
      '127.0.0.1',
    );

    expect(result.token).toBe('access-token');
    expect(result.refreshToken).toBe('refresh-token');
    expect(userServiceMock.updateLastLogin).toHaveBeenCalledWith('user-1', '127.0.0.1');
  });

  it('blocks registration when email is already in use', async () => {
    userServiceMock.findByEmail.mockResolvedValue({ id: 'existing-user' });

    await expect(
      service.register({
        email: 'admin@tenant.com',
        password: '12345678',
        name: 'Admin',
        tenantName: 'Tenant One',
        tenantId: 'tenant-placeholder',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('creates tenant, admin role and user during successful register flow', async () => {
    userServiceMock.findByEmail.mockResolvedValue(null);
    tenantServiceMock.findBySlug.mockResolvedValue(null);
    tenantServiceMock.create.mockResolvedValue({ id: 'tenant-1' });
    roleServiceMock.create.mockResolvedValue({ id: 'role-admin' });
    userServiceMock.create.mockResolvedValue({
      id: 'user-1',
      email: 'new@tenant.com',
      tenantId: 'tenant-1',
    });
    userServiceMock.addRole.mockResolvedValue(undefined);

    const result = await service.register({
      email: 'new@tenant.com',
      password: '12345678',
      name: 'Admin',
      tenantName: 'Tenant One',
      tenantId: 'tenant-placeholder',
    });

    expect(result).toEqual({
      id: 'user-1',
      email: 'new@tenant.com',
      tenantId: 'tenant-1',
    });
    expect(clsMock.set).toHaveBeenCalledWith(RequestContext.TENANT_ID, 'tenant-1');
  });
});
