import { Entity, PrimaryGeneratedColumn, ManyToOne, Unique, Column } from 'typeorm';
import type { Product } from './product.entity';
import { Category } from '../../category/entities/category.entity';

@Entity()
@Unique(['product', 'category'])
export class ProductCategory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  productId: string;

  @ManyToOne(
    () => require('./product.entity').Product,
    (product: Product) => product.categories,
    { onDelete: 'CASCADE' },
  )
  product: Product;

  @Column()
  categoryId: string;

  @ManyToOne(() => Category, (category) => category.products, { onDelete: 'CASCADE' })
  category: Category;
}
