import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export type MediaAssetStatus =
  'pending' | 'attached' | 'orphan' | 'quarantine' | 'rejected' | 'processed';

export type MediaRole = 'primary' | 'gallery' | 'unknown';

@Entity({ name: 'platform_media_assets' })
export class MediaAssetEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ length: 60, default: '' })
  productCode: string;

  @Column({ type: 'varchar', length: 80, nullable: true })
  productId: string | null;

  @Column({ length: 260 })
  originalFileName: string;

  @Column({ length: 260 })
  storedFileName: string;

  @Column({ length: 400 })
  url: string;

  @Index()
  @Column({ length: 64 })
  contentHash: string;

  @Column({ type: 'int', nullable: true })
  sequence: number | null;

  @Column({ length: 20, default: 'unknown' })
  role: MediaRole;

  @Column({ length: 20, default: 'pending' })
  status: MediaAssetStatus;

  @Column({ type: 'varchar', length: 300, nullable: true })
  quarantineReason: string | null;

  @Column({ type: 'int', nullable: true })
  width: number | null;

  @Column({ type: 'int', nullable: true })
  height: number | null;

  @Column({ type: 'int', default: 0 })
  byteSize: number;

  @Column({ type: 'simple-json', nullable: true })
  derivatives: Record<string, string> | null;

  @Column({ type: 'varchar', length: 120, nullable: true })
  uploadedBy: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

@Entity({ name: 'platform_inventory_audits' })
export class InventoryAuditEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ length: 60 })
  productCode: string;

  @Column({ type: 'varchar', length: 80, nullable: true })
  variationId: string | null;

  @Column({ type: 'int' })
  previousStock: number;

  @Column({ type: 'int' })
  newStock: number;

  @Column({ length: 40 })
  strategy: string; // full_replace | incremental | skipped_stale

  @Column({ type: 'varchar', length: 80, nullable: true })
  importId: string | null;

  @Column({ type: 'varchar', length: 120, nullable: true })
  sourceReference: string | null;

  @Column({ type: 'varchar', length: 120, nullable: true })
  actor: string | null;

  @CreateDateColumn()
  createdAt: Date;
}
