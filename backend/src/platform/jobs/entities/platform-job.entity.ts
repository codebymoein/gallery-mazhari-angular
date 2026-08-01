import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export type PlatformJobStatus =
  | 'queued'
  | 'running'
  | 'paused'
  | 'completed'
  | 'failed'
  | 'cancelled'
  | 'dead_letter';

@Entity({ name: 'platform_jobs' })
export class PlatformJobEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ length: 60 })
  type: string;

  @Column({ length: 30, default: 'queued' })
  status: PlatformJobStatus;

  @Column({ type: 'simple-json', nullable: true })
  payload: Record<string, unknown> | null;

  @Column({ type: 'simple-json', nullable: true })
  result: Record<string, unknown> | null;

  @Column({ type: 'int', default: 0 })
  progressPercent: number;

  @Column({ length: 120, default: '' })
  currentStep: string;

  @Column({ type: 'int', default: 0 })
  completedItems: number;

  @Column({ type: 'int', default: 0 })
  failedItems: number;

  @Column({ type: 'int', default: 0 })
  totalItems: number;

  @Column({ type: 'int', default: 0 })
  attempt: number;

  @Column({ type: 'varchar', length: 500, nullable: true })
  lastError: string | null;

  @Column({ type: 'varchar', length: 120, nullable: true })
  createdBy: string | null;

  @Column({ type: 'varchar', length: 40, nullable: true })
  startedAt: string | null;

  @Column({ type: 'varchar', length: 40, nullable: true })
  finishedAt: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
