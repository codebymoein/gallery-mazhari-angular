import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { CeremonyType } from '../planner-task-catalog';

@Entity({ name: 'wedding_planners' })
@Index('UQ_wedding_planners_user_id', ['userId'], { unique: true })
export class WeddingPlannerEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  userId: string;

  @Column({ type: 'date' })
  eventDate: string;

  @Column({ type: 'simple-json', default: '[]' })
  ceremonyTypes: CeremonyType[];

  @Column({ type: 'simple-json', default: '[]' })
  completedTaskIds: string[];

  @Column({ type: 'integer', default: 1 })
  version: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
