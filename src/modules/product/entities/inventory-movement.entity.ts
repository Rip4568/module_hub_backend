import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne } from 'typeorm';
import { TenantAwareEntity } from '../../../common/entities/tenant-aware.entity';
import { Product } from './product.entity';
import { ProductVariant } from './product-variant.entity';
import { Tenant } from '../../tenant/entities/tenant.entity';
import { StockLocationType } from './stock-level.entity';

export enum InventoryMovementType {
    IN = 'IN',
    OUT = 'OUT',
    TRANSFER = 'TRANSFER',
    ADJUSTMENT = 'ADJUSTMENT',
    SALE = 'SALE',
}

@Entity()
export class InventoryMovement extends TenantAwareEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => Tenant, { onDelete: 'CASCADE' })
    tenant: Tenant;

    @Column({
        type: 'enum',
        enum: InventoryMovementType
    })
    type: InventoryMovementType;

    @Column({
        type: 'enum',
        enum: StockLocationType
    })
    originLocationType: StockLocationType;

    @Column({ nullable: true })
    originReferenceId?: string; // vehicleId or warehouseId

    @Column({
        type: 'enum',
        enum: StockLocationType,
        nullable: true
    })
    destinationLocationType?: StockLocationType;

    @Column({ nullable: true })
    destinationReferenceId?: string; // vehicleId or warehouseId

    @Column()
    quantity: number;

    @Column()
    productId: string;

    @ManyToOne(() => Product, { onDelete: 'CASCADE' })
    product: Product;

    @Column({ nullable: true })
    variantId?: string;

    @ManyToOne(() => ProductVariant, { onDelete: 'CASCADE', nullable: true })
    variant?: ProductVariant;

    @Column({ nullable: true })
    reason?: string;

    @Column({ nullable: true })
    referenceId?: string; // Order ID, etc.

    @ManyToOne(() => Tenant, { nullable: true }) // Optional: User who performed action
    performerId?: string;

    @CreateDateColumn()
    createdAt: Date;
}
