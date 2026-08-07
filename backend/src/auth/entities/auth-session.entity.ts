import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryColumn,
} from 'typeorm';

@Entity({ name: 'auth_sessions' })
export class AuthSessionEntity {
  @PrimaryColumn({ type: 'varchar', length: 64 })
  id: string;

  @Index()
  @Column({ type: 'uuid' })
  userId: string;

  @Column()
  expiresAt: Date;

  @Column({ nullable: true })
  revokedAt?: Date;

  @CreateDateColumn()
  createdAt: Date;
}
