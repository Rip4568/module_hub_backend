import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
} from 'typeorm';
import { TenantAwareEntity } from '../../../common/entities/tenant-aware.entity';
import { Tenant } from '../../tenant/entities/tenant.entity';
import { ProductCategory } from './product-category.entity';
import { ProductVariant } from './product-variant.entity';
import { OrderItem } from '../../order/entities/order-item.entity';
import { ProductEcommerceProfile } from './ecommerce-profile.entity';

@Entity()
export class Product extends TenantAwareEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Tenant, { onDelete: 'CASCADE' })
  tenant: Tenant;

  @Column({ nullable: true })
  sku: string;

  @Column()
  name: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  compareAtPrice: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  cost: number;

  @Column({ default: true })
  trackInventory: boolean;

  @Column({ default: 0 })
  stock: number; // CACHE ONLY. Source of truth is StockLevel entity.

  @Column({ nullable: true })
  minStock: number;

  @Column({ nullable: true })
  maxStock: number;

  @Column({ type: 'decimal', precision: 10, scale: 3, nullable: true })
  weight: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  width: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  height: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  length: number;

  @Column({ type: 'json', nullable: true })
  metadata: any;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToOne(() => ProductEcommerceProfile, (profile) => profile.product)
  ecommerceProfile: ProductEcommerceProfile;

  @OneToMany(() => ProductCategory, (productCategory) => productCategory.product)
  categories: ProductCategory[];

  @OneToMany(() => ProductVariant, (variant) => variant.product)
  variants: ProductVariant[];

  @OneToMany(() => OrderItem, (orderItem) => orderItem.product)
  orderItems: OrderItem[];
}
