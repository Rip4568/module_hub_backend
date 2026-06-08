import { ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ClsService } from 'nestjs-cls';
import { ModuleGuard } from './module.guard';
import { TenantModuleService } from '../../modules/tenant-module/tenant-module.service';
import { RequestContext } from '../context/request.context';

describe('ModuleGuard', () => {
  const reflectorMock = {
    getAllAndOverride: jest.fn(),
    get: jest.fn(),
  };

  const tenantModuleServiceMock = {
    isModuleEnabled: jest.fn(),
  };

  const clsMock = {
    get: jest.fn(),
  };

  const createContext = () =>
    ({
      getHandler: jest.fn(),
      getClass: jest.fn(),
    }) as any;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('allows route when no module requirement exists', async () => {
    reflectorMock.get.mockReturnValue(undefined);
    const guard = new ModuleGuard(
      reflectorMock as unknown as Reflector,
      tenantModuleServiceMock as unknown as TenantModuleService,
      clsMock as unknown as ClsService,
    );

    await expect(guard.canActivate(createContext())).resolves.toBe(true);
  });

  it('throws ForbiddenException when tenant context is missing', async () => {
    reflectorMock.get.mockReturnValue('delivery');
    clsMock.get.mockReturnValue(undefined);
    const guard = new ModuleGuard(
      reflectorMock as unknown as Reflector,
      tenantModuleServiceMock as unknown as TenantModuleService,
      clsMock as unknown as ClsService,
    );

    await expect(guard.canActivate(createContext())).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('throws ForbiddenException when module is disabled for tenant', async () => {
    reflectorMock.get.mockReturnValue('delivery');
    clsMock.get.mockReturnValue('tenant-1');
    tenantModuleServiceMock.isModuleEnabled.mockResolvedValue(false);
    const guard = new ModuleGuard(
      reflectorMock as unknown as Reflector,
      tenantModuleServiceMock as unknown as TenantModuleService,
      clsMock as unknown as ClsService,
    );

    await expect(guard.canActivate(createContext())).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('allows access when module is enabled for tenant', async () => {
    reflectorMock.get.mockReturnValue('delivery');
    clsMock.get.mockImplementation((key: string) => (key === RequestContext.TENANT_ID ? 'tenant-1' : undefined));
    tenantModuleServiceMock.isModuleEnabled.mockResolvedValue(true);
    const guard = new ModuleGuard(
      reflectorMock as unknown as Reflector,
      tenantModuleServiceMock as unknown as TenantModuleService,
      clsMock as unknown as ClsService,
    );

    await expect(guard.canActivate(createContext())).resolves.toBe(true);
    expect(tenantModuleServiceMock.isModuleEnabled).toHaveBeenCalledWith('tenant-1', 'delivery');
  });
});
