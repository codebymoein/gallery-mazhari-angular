import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'platform_product_variations' })
export class ProductVariationEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ length: 80 })
  parentProductId: string;

  @Index()
  @Column({ length: 60 })
  parentCode: string;

  @Index({ unique: true })
  @Column({ length: 60 })
  sku: string;

  @Index({ unique: true })
  @Column({ length: 60 })
  barcode: string;

  @Column({ type: 'varchar', length: 40, nullable: true })
  size: string | null;

  @Column({ type: 'varchar', length: 80, nullable: true })
  color: string | null;

  @Column({ type: 'varchar', length: 80, nullable: true })
  material: string | null;

  @Column({ type: 'float', nullable: true })
  price: number | null;

  @Column({ type: 'int', default: 0 })
  stock: number;

  @Column({ type: 'int', default: 0 })
  reservedStock: number;

  @Column({ default: true })
  available: boolean;

  @Column({ type: 'simple-json', nullable: true })
  photos: Array<{ url: string; fileName: string }> | null;

  @Column({ length: 30, default: 'draft' })
  status: string;

  @Column({ type: 'varchar', length: 80, nullable: true })
  importId: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
