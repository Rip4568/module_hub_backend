import { ClsService } from 'nestjs-cls';

export class RequestContext {
  static readonly TENANT_ID = 'tenantId';
  static readonly USER_ID = 'userId';

  constructor(private readonly cls: ClsService) {}

  get tenantId(): string | undefined {
    return this.cls.get(RequestContext.TENANT_ID);
  }

  set tenantId(value: string | undefined) {
    this.cls.set(RequestContext.TENANT_ID, value);
  }

  get userId(): string | undefined {
    return this.cls.get(RequestContext.USER_ID);
  }

  set userId(value: string | undefined) {
    this.cls.set(RequestContext.USER_ID, value);
  }
}
