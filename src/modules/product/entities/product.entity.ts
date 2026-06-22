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
import type { Tenant } from '../../tenant/entities/tenant.entity';
import type { ProductCategory } from './product-category.entity';
import type { ProductVariant } from './product-variant.entity';
import type { OrderItem } from '../../order/entities/order-item.entity';
import type { ProductEcommerceProfile } from './ecommerce-profile.entity';

@Entity()
export class Product extends TenantAwareEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(
    () => require('../../tenant/entities/tenant.entity').Tenant,
    { onDelete: 'CASCADE' },
  )
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

  @OneToOne(
    () => require('./ecommerce-profile.entity').ProductEcommerceProfile,
    (profile: ProductEcommerceProfile) => profile.product,
  )
  ecommerceProfile: ProductEcommerceProfile;

  @OneToMany(
    () => require('./product-category.entity').ProductCategory,
    (productCategory: ProductCategory) => productCategory.product,
  )
  categories: ProductCategory[];

  @OneToMany(
    () => require('./product-variant.entity').ProductVariant,
    (variant: ProductVariant) => variant.product,
  )
  variants: ProductVariant[];

  @OneToMany(
    () => require('../../order/entities/order-item.entity').OrderItem,
    (orderItem: OrderItem) => orderItem.product,
  )
  orderItems: OrderItem[];
}
