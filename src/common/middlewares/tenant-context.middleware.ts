import { Injectable, NestMiddleware } from '@nestjs/common';
import { ClsService } from 'nestjs-cls';
import { RequestContext } from '../context/request.context';

@Injectable()
export class TenantContextMiddleware implements NestMiddleware {
    constructor(private readonly cls: ClsService) { }

    use(req: any, res: any, next: () => void) {
        const tenantId = req.user?.tenantId;
        const userId = req.user?.userId;

        this.cls.set(RequestContext.TENANT_ID, tenantId);
        this.cls.set(RequestContext.USER_ID, userId);

        next();
    }
}
