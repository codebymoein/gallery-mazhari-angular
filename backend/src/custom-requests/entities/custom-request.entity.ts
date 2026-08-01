import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

export type CustomRequestType = 'veil' | 'dress';

@Entity('custom_requests')
@Index('idx_custom_requests_type_status', ['type', 'status'])
export class CustomRequestEntity {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column({ type: 'varchar', length: 20 }) type: CustomRequestType;
  @Column({ type: 'varchar', length: 100 }) fullName: string;
  @Column({ type: 'varchar', length: 20 }) phone: string;
  @Column({ type: 'varchar', length: 160, nullable: true }) email: string | null;
  @Column({ type: 'varchar', length: 80, nullable: true }) city: string | null;
  @Column({ type: 'varchar', length: 20, nullable: true }) ceremonyDate: string | null;
  @Column({ type: 'varchar', length: 40 }) contactTime: string;
  @Column({ type: 'varchar', length: 30, default: 'phone' }) preferredContact: string;
  @Column({ type: 'varchar', length: 160 }) modelTitle: string;
  @Column({ type: 'varchar', length: 2000 }) description: string;
  @Column({ type: 'varchar', length: 80, nullable: true }) color: string | null;
  @Column({ type: 'varchar', length: 120, nullable: true }) fabric: string | null;
  @Column({ type: 'varchar', length: 80, nullable: true }) sizeOrLength: string | null;
  @Column({ type: 'varchar', length: 120, nullable: true }) budget: string | null;
  @Column({ type: 'simple-json', nullable: true }) imageUrls: string[] | null;
  @Column({ type: 'varchar', length: 30, default: 'new' }) status: string;
  @Column({ type: 'varchar', length: 1000, nullable: true }) adminNote: string | null;
  @CreateDateColumn() createdAt: Date;
  @UpdateDateColumn() updatedAt: Date;
}
