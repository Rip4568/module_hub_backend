import { Entity, PrimaryGeneratedColumn, ManyToOne, Unique, Column } from 'typeorm';
import { Product } from './product.entity';
import { Category } from '../../category/entities/category.entity';

@Entity()
@Unique(['product', 'category'])
export class ProductCategory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  productId: string;

  @ManyToOne(() => Product, (product) => product.categories, { onDelete: 'CASCADE' })
  product: Product;

  @Column()
  categoryId: string;

  @ManyToOne(() => Category, (category) => category.products, { onDelete: 'CASCADE' })
  category: Category;
}
