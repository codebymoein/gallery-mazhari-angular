import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export type ProductStatus =
  | 'waiting_photo'
  | 'ready_for_approval'
  | 'published'
  | 'rejected';

export interface ProductPhoto {
  url: string;
  fileName: string;
  addedAt: string;
}

@Entity({ name: 'staging_products' })
export class ProductEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 60, unique: true })
  code: string;

  @Column({ length: 200 })
  name: string;

  @Column({ length: 120 })
  category: string;

  @Column({ length: 120, default: '' })
  parentCategory: string;

  @Column({ length: 120, default: '' })
  parentCategorySlug: string;

  @Column({ length: 120, default: '' })
  categorySlug: string;

  @Column({ type: 'int', default: 0 })
  stock: number;

  @Column({ default: false })
  isNewImport: boolean;

  @Column({ length: 30, default: 'waiting_photo' })
  status: ProductStatus;

  /** simple-json برای سازگاری همزمان با Postgres و SQLite */
  @Column({ type: 'simple-json' })
  photos: ProductPhoto[];

  /** تاریخ‌ها به‌صورت رشته ISO ذخیره می‌شوند تا بین درایورها portable باشند */
  @Column({ type: 'varchar', length: 40, nullable: true })
  importedAt?: string | null;

  @Column({ type: 'varchar', length: 40, nullable: true })
  processedAt?: string | null;

  @Column({ type: 'varchar', length: 40, nullable: true })
  publishedAt?: string | null;

  @Column({ type: 'varchar', length: 120, nullable: true })
  processedBy?: string | null;

  @Column({ type: 'varchar', length: 120, nullable: true })
  publishedBy?: string | null;

  @Column({ type: 'varchar', length: 300, nullable: true })
  notes?: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
