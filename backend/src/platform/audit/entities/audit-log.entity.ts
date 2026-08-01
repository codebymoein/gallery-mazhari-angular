import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

/**
 * Immutable audit trail — ordinary admins must not edit.
 * No UpdateDateColumn / no update API.
 */
@Entity({ name: 'platform_audit_logs' })
export class AuditLogEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ length: 80 })
  action: string;

  @Index()
  @Column({ length: 80, default: '' })
  entityType: string;

  @Index()
  @Column({ length: 80, default: '' })
  entityId: string;

  @Column({ type: 'varchar', length: 80, nullable: true })
  importId: string | null;

  @Column({ type: 'varchar', length: 120, nullable: true })
  actor: string | null;

  @Column({ type: 'simple-json', nullable: true })
  previousValue: unknown;

  @Column({ type: 'simple-json', nullable: true })
  newValue: unknown;

  @Column({ type: 'varchar', length: 120, nullable: true })
  source: string | null;

  @Column({ type: 'varchar', length: 40, nullable: true })
  ruleVersion: string | null;

  @CreateDateColumn()
  createdAt: Date;
}
