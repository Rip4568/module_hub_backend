import { Injectable, NestMiddleware } from '@nestjs/common';
import { ClsService } from 'nestjs-cls';
import { RequestContext } from '../context/request.context';

@Injectable()
export class TenantContextMiddleware implements NestMiddleware {
    constructor(private readonly cls: ClsService) { }

    use(req: any, res: any, next: () => void) {
        let tenantId = req.user?.tenantId;
        const userId = req.user?.userId;

        if (!tenantId) {
            // Support for public storefront access
            tenantId = req.headers['x-tenant-id'];

            // If not in header, try to extract from URL if it matches /storefront/:tenantId/
            if (!tenantId && req.url.includes('/storefront/')) {
                const parts = req.url.split('/');
                const storefrontIndex = parts.indexOf('storefront');
                if (storefrontIndex !== -1 && parts[storefrontIndex + 1]) {
                    tenantId = parts[storefrontIndex + 1];
                }
            }
        }

        this.cls.set(RequestContext.TENANT_ID, tenantId);
        this.cls.set(RequestContext.USER_ID, userId);

        next();
    }
}
