import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('password_reset_tokens')
@Index('idx_password_reset_hash', ['tokenHash'], { unique: true })
export class PasswordResetTokenEntity {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column({ type: 'varchar', length: 64, unique: true }) tokenHash: string;
  @Column({ type: 'varchar', length: 36 }) userId: string;
  @Column({ type: 'varchar', length: 40 }) expiresAt: string;
  @Column({ type: 'varchar', length: 40, nullable: true }) usedAt:
    string | null;
  @CreateDateColumn() createdAt: Date;
}
