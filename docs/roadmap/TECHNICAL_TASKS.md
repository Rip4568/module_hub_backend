# ModuleHub Backend Roadmap

## Phase 1: Foundation & Security (The Kernel)
- [ ] **Tenant Isolation (TypeORM)** <!-- id: 0 -->
  - [ ] Implement `TenantAware` Base Entity or Mixin.
  - [ ] Create TypeORM Subscriber to enforce `tenantId` on INSERT/UPDATE.
  - [ ] Implement Global Query Scope (or Custom Repository pattern) to filter by `tenantId`.
  - [ ] Test isolation: Ensure Tenant A cannot see Tenant B's data.
- [ ] **Authentication & RBAC** <!-- id: 1 -->
  - [ ] Verify/Finalize JWT Flow (Login, Refresh, Reset Password).
  - [ ] Implement Redis Cache for Permissions (RoleGuard is too heavy if hitting DB).
  - [ ] Create `ModuleGuard` to restrict access to inactive modules.

## Phase 2: Core Business Logic (Inventory Core)
- [ ] **Refactor Product Module (Decoupling)** <!-- id: 2 -->
  - [ ] Create `ProductCore` (or clean existing `Product`) containing only: SKU, Stock, Cost, Dimensions, Name.
  - [ ] Create `ProductEcommerce` entity (One-to-One with Product) containing: PublishedAt, MetaTags, Slug, Images (if promotional), Description (HTML).
  - [ ] Migrate existing data to new structure.
- [ ] **Inventory Management** <!-- id: 3 -->
  - [ ] Implement "Stock Ledger" (Movimentações de Estoque) table (InventoryTransaction).
  - [ ] Prevent hard deletion of stock movements (only reversing entries).

## Phase 3: Financial & Delivery (Specialization)
- [ ] **Financial Module** <!-- id: 4 -->
  - [ ] Implement Accounts Payable/Receivable.
  - [ ] Link Financial Transaction creation to Order Status changes.
- [ ] **Delivery & Fleet** <!-- id: 5 -->
  - [ ] Finalize Vehicle & Driver CRUD.
  - [ ] Implement Delivery creation linked to Orders.

## Phase 4: E-commerce Integration
- [ ] **Storefront API** <!-- id: 6 -->
  - [ ] Create Public (Unauthenticated) Controller for Products.
  - [ ] Implement "Guest Checkout" flow.

## Documentation & Handover
- [ ] Create `docs/architecture/TENANT_ISOLATION.md` detailing the TypeORM strategy.
- [ ] Create `docs/architecture/INVENTORY_REFACTOR.md` detailing the schema changes.
