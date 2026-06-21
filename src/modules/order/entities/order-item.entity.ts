import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne } from 'typeorm';
import { Order } from './order.entity';
import { Product } from '../../product/entities/product.entity';
import { ProductVariant } from '../../product/entities/product-variant.entity';
import { TenantAwareEntity } from '../../../common/entities/tenant-aware.entity';

@Entity()
export class OrderItem extends TenantAwareEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  orderId: string;

  @ManyToOne(() => Order, (order) => order.items, { onDelete: 'CASCADE' })
  order: Order;

  @Column({ nullable: true })
  productId: string;

  @ManyToOne(() => Product, (product) => product.orderItems, { onDelete: 'SET NULL' })
  product: Product;

  @Column({ nullable: true })
  variantId: string;

  @ManyToOne(() => ProductVariant, (variant) => variant.orderItems, { onDelete: 'SET NULL' })
  variant: ProductVariant;

  @Column()
  name: string;

  @Column({ nullable: true })
  sku: string;

  @Column('int')
  quantity: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  unitPrice: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  subtotal: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  discount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  total: number;

  @Column({ type: 'json', nullable: true })
  metadata: any;

  @CreateDateColumn()
  createdAt: Date;
}
