import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  Unique,
} from 'typeorm';
import { TenantAwareEntity } from '../../../common/entities/tenant-aware.entity';
import type { Tenant } from '../../tenant/entities/tenant.entity';
import type { ProductCategory } from '../../product/entities/product-category.entity';

@Entity()
@Unique(['tenantId', 'slug'])
export class Category extends TenantAwareEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(
    () => require('../../tenant/entities/tenant.entity').Tenant,
    { onDelete: 'CASCADE' },
  )
  tenant: Tenant;

  @Column()
  name: string;

  @Column()
  slug: string;

  @Column({ nullable: true })
  description: string;

  @Column({ nullable: true })
  parentId: string;

  @ManyToOne(() => Category, (category) => category.children, { onDelete: 'SET NULL' })
  parent: Category;

  @OneToMany(() => Category, (category) => category.parent)
  children: Category[];

  @Column({ nullable: true })
  metaTitle: string;

  @Column({ nullable: true })
  metaDescription: string;

  @Column({ nullable: true })
  image: string;

  @Column({ default: 0 })
  order: number;

  @Column({ nullable: true })
  type: string;

  @Column({ nullable: true })
  color: string;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(
    () => require('../../product/entities/product-category.entity').ProductCategory,
    (productCategory: ProductCategory) => productCategory.category,
  )
  products: ProductCategory[];
}
