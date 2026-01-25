import { Repository, SelectQueryBuilder, FindManyOptions, FindOneOptions, ObjectLiteral, FindOptionsWhere } from 'typeorm';
import { ClsService } from 'nestjs-cls';
import { RequestContext } from '../context/request.context';
import { TenantAwareEntity } from '../entities/tenant-aware.entity';
import { UnauthorizedException } from '@nestjs/common';

export class TenantRepository<T extends TenantAwareEntity> extends Repository<T> {
    constructor(
        target: any,
        manager: any,
        queryRunner: any,
        private readonly cls: ClsService,
    ) {
        super(target, manager, queryRunner);
    }

    private get tenantId(): string | undefined {
        return this.cls.get(RequestContext.TENANT_ID);
    }

    private applyTenantFilter(options: any): any {
        const tenantId = this.tenantId;
        if (!tenantId) {
            // In a zero-trust environment, we might want to throw an error here.
            // However, for certain system-level operations, we might need to bypass.
            // For now, we follow the Tech Lead's guidance on using the context.
            return options;
        }

        if (!options) {
            options = { where: {} };
        }

        if (!options.where) {
            options.where = {};
        }

        // In some cases 'where' can be an array or other complex type, 
        // but for the standard Repository pattern we handle the simple Object literal for now.
        if (Array.isArray(options.where)) {
            options.where = options.where.map((w: any) => ({ ...w, tenantId }));
        } else {
            options.where = { ...options.where, tenantId };
        }

        return options;
    }

    find(options?: FindManyOptions<T>): Promise<T[]> {
        return super.find(this.applyTenantFilter(options));
    }

    findOne(options: FindOneOptions<T>): Promise<T | null> {
        return super.findOne(this.applyTenantFilter(options));
    }

    // Add more overrides as needed (count, findAndCount, etc.)
}
