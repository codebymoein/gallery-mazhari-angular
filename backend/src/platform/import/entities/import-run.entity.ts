import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export type ImportRunMode = 'dry_run' | 'commit';
export type ImportRunStatus =
  | 'dry_run_complete'
  | 'queued'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'rolled_back'
  | 'partial';

@Entity({ name: 'platform_import_runs' })
export class ImportRunEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index({ unique: true })
  @Column({ length: 64 })
  fingerprint: string;

  @Column({ length: 20, default: 'dry_run' })
  mode: ImportRunMode;

  @Column({ length: 30, default: 'dry_run_complete' })
  status: ImportRunStatus;

  @Column({ length: 260, default: '' })
  fileName: string;

  @Column({ type: 'simple-json' })
  mapping: Record<string, string>;

  @Column({ type: 'float', default: 0 })
  mappingConfidence: number;

  @Column({ type: 'simple-json', nullable: true })
  report: Record<string, unknown> | null;

  /** Snapshot of changed product IDs / previous values for rollback */
  @Column({ type: 'simple-json', nullable: true })
  changeSet: Record<string, unknown> | null;

  @Column({ type: 'varchar', length: 120, nullable: true })
  createdBy: string | null;

  @Column({ type: 'varchar', length: 120, nullable: true })
  confirmedBy: string | null;

  @Column({ type: 'varchar', length: 40, nullable: true })
  sourceTimestamp: string | null;

  @Column({ type: 'varchar', length: 80, nullable: true })
  jobId: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

@Entity({ name: 'platform_mapping_templates' })
export class MappingTemplateEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 160 })
  name: string;

  @Index({ unique: true })
  @Column({ length: 500 })
  headerFingerprint: string;

  @Column({ type: 'simple-json' })
  mapping: Record<string, string>;

  @Column({ type: 'varchar', length: 120, nullable: true })
  createdBy: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
