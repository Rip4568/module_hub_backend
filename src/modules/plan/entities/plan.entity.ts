import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity()
export class Plan {
  @PrimaryColumn()
  id: string;

  @Column()
  name: string;

  @Column({ type: 'int', nullable: true })
  priceCents: number | null;

  @Column({ default: 'BRL' })
  currency: string;

  @Column({ type: 'int', nullable: true })
  maxBillableModules: number | null;

  @Column({ default: false })
  isContactOnly: boolean;

  @Column({ type: 'int', default: 0 })
  sortOrder: number;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
