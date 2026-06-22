import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { ClsService } from 'nestjs-cls';
import { AuthService } from './auth.service';
import { UserService } from '../user/user.service';
import { TenantService } from '../tenant/tenant.service';
import { TenantModuleService } from '../tenant-module/tenant-module.service';
import { RoleService } from '../role/role.service';
import { DriverService } from '../driver/driver.service';
import { EmailTemplateService } from '../../infrastructure/email/email-template.service';
import { PermissionService } from '../permission/permission.service';
import { RequestContext } from '../../common/context/request.context';

describe('AuthService', () => {
  let service: AuthService;

  const userServiceMock = {
    findByEmail: jest.fn(),
    findOneByTenant: jest.fn(),
    create: jest.fn(),
    addRole: jest.fn(),
    updateLastLogin: jest.fn(),
  };

  const tenantServiceMock = {
    findBySlug: jest.fn(),
    create: jest.fn(),
    findMyTenant: jest.fn(),
  };

  const tenantModuleServiceMock = {
    getActiveModules: jest.fn(),
    getModuleUsageForTenant: jest.fn(),
  };

  const jwtServiceMock = {
    sign: jest.fn(),
  };

  const configServiceMock = {
    get: jest.fn(),
  };

  const roleServiceMock = {
    create: jest.fn(),
    grantAllPermissions: jest.fn(),
  };

  const driverServiceMock = {
    createFromUser: jest.fn(),
  };

  const emailTemplateServiceMock = {
    sendForgotPassword: jest.fn(),
  };

  const permissionServiceMock = {
    getUserPermissions: jest.fn(),
    findAll: jest.fn(),
  };

  const clsMock = {
    get: jest.fn(),
    set: jest.fn(),
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
        { provide: DriverService, useValue: driverServiceMock },
        { provide: EmailTemplateService, useValue: emailTemplateServiceMock },
        { provide: PermissionService, useValue: permissionServiceMock },
        { provide: ClsService, useValue: clsMock },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('throws when tenant context is missing in getCurrentUser', async () => {
    await expect(service.getCurrentUser('user-1')).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('returns onboardingCompleted and billableCount in login', async () => {
    jwtServiceMock.sign.mockReturnValue('signed-token');
    tenantModuleServiceMock.getActiveModules.mockResolvedValue(['erp']);
    tenantModuleServiceMock.getModuleUsageForTenant.mockResolvedValue({
      billableActiveCount: 1,
      maxModules: 5,
      isAtLimit: false,
    });
    tenantServiceMock.findMyTenant.mockResolvedValue({
      id: 'tenant-1',
      config: { onboardingCompleted: true },
    });

    const result = await service.login({
      id: 'user-1',
      email: 'admin@tenant.com',
      tenantId: 'tenant-1',
    });

    expect(result.onboardingCompleted).toBe(true);
    expect(result.billableCount).toBe(1);
    expect(result.activeModules).toEqual(['erp']);
    expect(result.token).toBe('signed-token');
  });

  it('defaults onboarding fields when tenant is missing in login', async () => {
    jwtServiceMock.sign.mockReturnValue('signed-token');
    tenantModuleServiceMock.getActiveModules.mockResolvedValue([]);

    const result = await service.login({
      id: 'user-1',
      email: 'admin@tenant.com',
    });

    expect(result.onboardingCompleted).toBe(false);
    expect(result.billableCount).toBe(0);
    expect(tenantServiceMock.findMyTenant).not.toHaveBeenCalled();
  });

  it('returns sanitized user, modules, permissions and tenant plan in getCurrentUser', async () => {
    userServiceMock.findOneByTenant.mockResolvedValue({
      id: 'user-1',
      email: 'admin@tenant.com',
      name: 'Admin',
      tenantId: 'tenant-1',
      password: 'hashed-password',
      roles: [{ role: { name: 'admin', displayName: 'Administrator' } }],
    });
    tenantModuleServiceMock.getActiveModules.mockResolvedValue(['erp', 'delivery']);
    tenantModuleServiceMock.getModuleUsageForTenant.mockResolvedValue({
      billableActiveCount: 1,
      maxModules: 5,
      isAtLimit: false,
    });
    permissionServiceMock.getUserPermissions.mockResolvedValue([
      'can_read_user',
      'can_create_user',
    ]);
    tenantServiceMock.findMyTenant.mockResolvedValue({
      id: 'tenant-1',
      name: 'Tenant One',
      plan: 'professional',
      config: { onboardingCompleted: true },
    });

    const result = await service.getCurrentUser('user-1', 'tenant-1');

    expect(result.user).toEqual({
      id: 'user-1',
      email: 'admin@tenant.com',
      name: 'Admin',
      role: 'admin',
      tenantId: 'tenant-1',
      avatar: undefined,
      phone: undefined,
    });
    expect(result.activeModules).toEqual(['erp', 'delivery']);
    expect(result.permissions).toEqual(['can_read_user', 'can_create_user']);
    expect(result.plan).toBe('professional');
    expect(result.onboardingCompleted).toBe(true);
    expect(result.billableCount).toBe(1);
    expect(result.tenant).toEqual({
      plan: 'professional',
      name: 'Tenant One',
      onboardingCompleted: true,
    });
    expect(userServiceMock.findOneByTenant).toHaveBeenCalledWith('user-1', 'tenant-1');
  });

  it('expands wildcard permissions for admin users in getCurrentUser', async () => {
    userServiceMock.findOneByTenant.mockResolvedValue({
      id: 'user-1',
      email: 'admin@tenant.com',
      name: 'Admin',
      tenantId: 'tenant-1',
      roles: [{ role: { name: 'admin', displayName: 'Administrator' } }],
    });
    tenantModuleServiceMock.getActiveModules.mockResolvedValue(['erp']);
    tenantModuleServiceMock.getModuleUsageForTenant.mockResolvedValue({
      billableActiveCount: 0,
      maxModules: 5,
      isAtLimit: false,
    });
    permissionServiceMock.getUserPermissions.mockResolvedValue(['*']);
    permissionServiceMock.findAll.mockResolvedValue([
      { name: 'can_read_user' },
      { name: 'can_create_user' },
    ]);
    tenantServiceMock.findMyTenant.mockResolvedValue({
      id: 'tenant-1',
      name: 'Tenant One',
      plan: 'starter',
      config: { onboardingCompleted: false },
    });

    const result = await service.getCurrentUser('user-1', 'tenant-1');

    expect(result.permissions).toEqual(['can_read_user', 'can_create_user']);
    expect(result.onboardingCompleted).toBe(false);
    expect(result.billableCount).toBe(0);
    expect(permissionServiceMock.findAll).toHaveBeenCalledWith('tenant-1');
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

  it('blocks registration when tenant slug is already taken', async () => {
    userServiceMock.findByEmail.mockResolvedValue(null);
    tenantServiceMock.findBySlug.mockResolvedValue({ id: 'tenant-existing' });

    await expect(
      service.register({
        email: 'new@tenant.com',
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
    expect(tenantServiceMock.create).toHaveBeenCalledWith({
      name: 'Tenant One',
      slug: 'tenant-one',
      plan: 'starter',
      config: { onboardingCompleted: false },
    });
    expect(clsMock.set).toHaveBeenCalledWith(RequestContext.TENANT_ID, 'tenant-1');
    expect(roleServiceMock.grantAllPermissions).toHaveBeenCalledWith('role-admin');
  });

  it('delegates driver profile creation to DriverService on registerDriver', async () => {
    userServiceMock.create.mockResolvedValue({
      id: 'user-1',
      email: 'driver@tenant.com',
      tenantId: 'tenant-1',
    });
    driverServiceMock.createFromUser.mockResolvedValue({ id: 'driver-1' });

    const result = await service.registerDriver({
      email: 'driver@tenant.com',
      password: '12345678',
      name: 'Driver',
      tenantId: 'tenant-1',
    });

    expect(result.id).toBe('user-1');
    expect(driverServiceMock.createFromUser).toHaveBeenCalledWith('user-1', 'tenant-1');
  });
});
