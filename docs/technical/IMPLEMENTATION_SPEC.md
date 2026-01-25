# Implementation Plan - ModuleHub Backend

## Goal Description
Implement strict "Tenant Isolation" using TypeORM to prevent data leakage between clients. Refactor the `Product` module to separate "Inventory Core" data from "E-commerce" data, enabling the system to support non-ecommerce clients (e.g., pure Logistics).

## Proposed Changes

### Core: Tenant Isolation
#### [NEW] [tenant.subscriber.ts](file:///c:/Users/user/Desktop/work/code/module_hub_backend/src/modules/tenant/tenant.subscriber.ts)
- Implement `EntitySubscriberInterface`.
- `beforeInsert` / `beforeUpdate`: Check if `tenantId` is set. If not, inject from `als` (AsyncLocalStorage) or Context (Request).
- Throw error if `tenantId` is missing in a tenant-required execution context.

#### [NEW] [abstract.entity.ts](file:///c:/Users/user/Desktop/work/code/module_hub_backend/src/common/entities/abstract-tenant.entity.ts)
- Base class for all tenant-scoped entities.
- Adds `tenantId` column and relation.

### Business: Inventory Core Refactor
#### [MODIFY] [product.entity.ts](file:///c:/Users/user/Desktop/work/code/module_hub_backend/src/modules/product/entities/product.entity.ts)
- **Remove**: `description`, `images`, `metaTitle`, `metaDescription`, `publishedAt`, `isFeatured`.
- **Keep**: `sku`, `name`, `price`, `cost`, `stock`, `dimensions`, `weight`.

#### [NEW] [product-ecommerce.entity.ts](file:///c:/Users/user/Desktop/work/code/module_hub_backend/src/modules/product/entities/product-ecommerce.entity.ts)
- One-to-One relation with `Product`.
- Columns: `description` (long text), `images` (json/array), `metaTitle`, `metaDescription`, `publishedAt`, `isFeatured`, `slug`.

#### [MODIFY] [product.service.ts](file:///c:/Users/user/Desktop/work/code/module_hub_backend/src/modules/product/product.service.ts)
- Update CRUD to handle the relation.
- `create`: Create Core first. If ecommerce data provided, create profile.
- `findAll`: Return Core data.
- `findOne`: Optionally join E-commerce profile.
