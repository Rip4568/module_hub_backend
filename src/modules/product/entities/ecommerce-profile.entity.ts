import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Product } from './product.entity';
import { TenantAwareEntity } from '../../../common/entities/tenant-aware.entity';

export enum EcommerceStatus {
    DRAFT = 'DRAFT',
    PUBLISHED = 'PUBLISHED',
}

@Entity('product_ecommerce_profiles')
export class ProductEcommerceProfile extends TenantAwareEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @OneToOne(() => Product, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'product_id' })
    product: Product;

    @Column()
    slug: string;

    @Column({ nullable: true })
    publicName: string;

    @Column({ type: 'text', nullable: true })
    description: string;

    @Column('simple-array', { nullable: true })
    images: string[];

    @Column({ type: 'json', nullable: true })
    seoTags: any;

    @Column({
        type: 'simple-enum',
        enum: EcommerceStatus,
        default: EcommerceStatus.DRAFT,
    })
    status: EcommerceStatus;

    @Column({ nullable: true })
    publishedAt: Date;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
