import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  Index,
} from 'typeorm';
import { Product } from './product.entity';
import { ProductVariant } from './product-variant.entity';
import { TenantAwareEntity } from '../../../common/entities/tenant-aware.entity';

export enum InventoryLogType {
  INCREASE = 'INCREASE', // Entrada manual ou ajuste
  SALE = 'SALE', // Saída por venda
  RETURN = 'RETURN', // Entrada por devolução
  ADJUST = 'ADJUST', // Ajuste negativo/perda
  CANCELLATION = 'CANCELLATION', // Entrada por cancelamento de pedido
}

@Entity('inventory_logs')
export class InventoryLog extends TenantAwareEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  productId: string;

  @ManyToOne(() => Product, { onDelete: 'CASCADE' })
  product: Product;

  @Column({ nullable: true })
  variantId: string;

  @ManyToOne(() => ProductVariant, { onDelete: 'SET NULL' })
  variant: ProductVariant;

  @Column({
    type: 'simple-enum',
    enum: InventoryLogType,
  })
  type: InventoryLogType;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  quantity: number;

  @Column({ nullable: true })
  referenceId: string; // Ex: ID do Pedido ou Entrega

  @Column({ nullable: true })
  notes: string;

  @CreateDateColumn()
  createdAt: Date;
}
