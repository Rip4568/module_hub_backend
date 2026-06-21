import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, Index } from 'typeorm';
import { TenantAwareEntity } from '../../../common/entities/tenant-aware.entity';
import { Product } from './product.entity';
import { ProductVariant } from './product-variant.entity';
import { Tenant } from '../../tenant/entities/tenant.entity';

export enum StockLocationType {
    WAREHOUSE = 'WAREHOUSE',
    VEHICLE = 'VEHICLE',
}

@Entity()
@Index(['tenant', 'product', 'variant', 'locationType', 'vehicleId', 'warehouseId'], { unique: true })
export class StockLevel extends TenantAwareEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => Tenant, { onDelete: 'CASCADE' })
    tenant: Tenant;

    @Column()
    productId: string;

    @ManyToOne(() => Product, { onDelete: 'CASCADE' })
    product: Product;

    @Column({ nullable: true })
    variantId: string;

    @ManyToOne(() => ProductVariant, { onDelete: 'CASCADE', nullable: true })
    variant: ProductVariant;

    @Column({ default: 0 })
    quantity: number;

    @Column({
        type: 'simple-enum',
        enum: StockLocationType,
        default: StockLocationType.WAREHOUSE
    })
    locationType: StockLocationType;

    // If locationType === VEHICLE
    @Column({ nullable: true })
    vehicleId: string;

    // We don't have a Vehicle entity imported here to avoid circular dependencies if not needed, 
    // or we can import it if we want the relation. For strictness, let's keep ID for now, 
    // or add relation if Vehicle is in another module (it is in Fleet/Driver usually).
    // Vehicle is likely in `result.vehicle` from `Order` relations, but let's just keep ID for simplicity 
    // unless we need the relation for validation. 
    // Just ID is fine for now as per plan.

    // If locationType === WAREHOUSE
    @Column({ nullable: true, default: 'DEFAULT' })
    warehouseId: string;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
