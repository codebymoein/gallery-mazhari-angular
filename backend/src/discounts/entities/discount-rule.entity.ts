import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export type DiscountScope = 'category' | 'subcategory' | 'product';

@Entity('discount_rules')
export class DiscountRuleEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 120 })
  title: string;

  @Column({ type: 'varchar', length: 200, nullable: true })
  subtitle: string | null;

  @Column({ type: 'varchar', length: 20 })
  scopeType: DiscountScope;

  @Column({ length: 160 })
  targetKey: string;

  @Column({ length: 160 })
  targetLabel: string;

  @Column({ type: 'int' })
  percent: number;

  @Column({ type: 'varchar', length: 40, nullable: true })
  badgeText: string | null;

  @Column({ type: 'int', default: 0 })
  priority: number;

  @Column({ default: true })
  active: boolean;

  @Column({ default: true })
  showOnHome: boolean;

  @Column({ type: 'varchar', length: 40, nullable: true })
  startsAt: string | null;

  @Column({ type: 'varchar', length: 40, nullable: true })
  endsAt: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
