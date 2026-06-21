import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne } from 'typeorm';
import { Delivery } from './delivery.entity';
import { TenantAwareEntity } from '../../../common/entities/tenant-aware.entity';

export enum DeliveryDocumentType {
    INVOICE = 'INVOICE',
    PROOF = 'PROOF',
    PHOTO = 'PHOTO',
    OTHERS = 'OTHERS',
}

@Entity('delivery_documents')
export class DeliveryDocument extends TenantAwareEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    deliveryId: string;

    @ManyToOne(() => Delivery, { onDelete: 'CASCADE' })
    delivery: Delivery;

    @Column({
        type: 'simple-enum',
        enum: DeliveryDocumentType,
    })
    type: DeliveryDocumentType;

    @Column()
    url: string;

    @CreateDateColumn()
    createdAt: Date;
}
