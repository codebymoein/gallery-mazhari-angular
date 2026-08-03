import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export type ProductStatus =
  | 'waiting_photo'
  | 'ready_for_approval'
  | 'published'
  | 'awaiting_stock'
  | 'rejected'
  /** Platform workflow extensions (unpublished by default) */
  | 'draft'
  | 'pending_data_review'
  | 'pending_variation_review'
  | 'pending_image_review'
  | 'enrichment_pending'
  | 'media_pending'
  | 'ready_for_approval_platform'
  | 'approved'
  | 'archived';

export type ProductType = 'simple' | 'variable' | 'variation';

export interface ProductPhoto {
  url: string;
  fileName: string;
  addedAt: string;
  role?: 'primary' | 'gallery';
  contentHash?: string;
}

@Entity({ name: 'staging_products' })
@Index('idx_staging_products_status', ['status'])
@Index('idx_staging_products_parent', ['parentCode'])
@Index('idx_staging_products_category', ['category'])
@Index('idx_staging_products_collection', ['collection'])
@Index('idx_staging_products_barcode', ['barcode'])
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

  // Some inventory units are fractional (for example fabric by metre).
  // Keep the authoritative Excel quantity exactly instead of rounding it.
  @Column({ type: 'float', default: 0 })
  stock: number;

  @Column({ default: false })
  isNewImport: boolean;

  @Column({ length: 30, default: 'waiting_photo' })
  status: ProductStatus;

  @Column({ type: 'varchar', length: 30, nullable: true })
  trashedFromStatus?: ProductStatus | null;

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

  // —— Platform enrichment fields (nullable for backward compatibility) ——

  @Column({ type: 'varchar', length: 60, nullable: true })
  barcode?: string | null;

  @Column({ type: 'varchar', length: 60, nullable: true })
  parentCode?: string | null;

  @Column({ length: 20, default: 'simple' })
  productType: ProductType;

  /** Authoritative integer amount in Iranian rials, imported from inventory Excel. */
  @Column({ type: 'bigint', nullable: true })
  price?: number | null;

  @Column({ type: 'bigint', nullable: true })
  salePrice?: number | null;

  @Column({ type: 'varchar', length: 40, nullable: true })
  size?: string | null;

  @Column({ type: 'varchar', length: 80, nullable: true })
  color?: string | null;

  @Column({ type: 'varchar', length: 80, nullable: true })
  material?: string | null;

  @Column({ type: 'varchar', length: 80, nullable: true })
  brand?: string | null;

  @Column({ type: 'varchar', length: 2000, nullable: true })
  description?: string | null;

  @Column({ type: 'varchar', length: 80, nullable: true })
  branch?: string | null;

  @Column({ type: 'varchar', length: 120, nullable: true })
  collection?: string | null;

  @Column({ type: 'int', default: 0 })
  reservedStock: number;

  @Column({ type: 'int', default: 2 })
  lowStockThreshold: number;

  @Column({ type: 'varchar', length: 40, nullable: true })
  inventoryUpdatedAt?: string | null;

  @Column({ type: 'varchar', length: 80, nullable: true })
  lastImportId?: string | null;

  /** Hidden internal merchandising metadata */
  @Column({ type: 'simple-json', nullable: true })
  enrichment?: Record<string, unknown> | null;

  @Column({ type: 'simple-json', nullable: true })
  seo?: Record<string, unknown> | null;

  @Column({ type: 'varchar', length: 40, nullable: true })
  scheduledPublishAt?: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  rejectionReason?: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
