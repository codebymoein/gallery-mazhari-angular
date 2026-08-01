import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('consultations')
@Index('idx_consultations_phone', ['phone'])
export class ConsultationEntity {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column({ type: 'varchar', length: 80 }) lastName: string;
  @Column({ type: 'varchar', length: 20 }) phone: string;
  @Column({ type: 'varchar', length: 20 }) ceremonyDate: string;
  @Column({ type: 'varchar', length: 40 }) contactTime: string;
  @Column({ type: 'varchar', length: 800, nullable: true }) message:
    string | null;
  @Column({ type: 'varchar', length: 40 }) source: string;
  @Column({ type: 'varchar', length: 160, nullable: true }) productName:
    string | null;
  @Column({ type: 'varchar', length: 100, nullable: true }) productId:
    string | null;
  @Column({ type: 'simple-json', nullable: true }) dreamItems: Array<{
    productId: string;
    name: string;
  }> | null;
  @Column({ type: 'varchar', length: 30, default: 'needs_followup' })
  followUpTag: string;
  @Column({ type: 'varchar', length: 1000, nullable: true }) adminNote:
    string | null;
  @CreateDateColumn() createdAt: Date;
  @UpdateDateColumn() updatedAt: Date;
}
