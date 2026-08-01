import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('notification_deliveries')
@Index('idx_notification_delivery_status', ['status', 'createdAt'])
export class NotificationDeliveryEntity {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column({ type: 'varchar', length: 30 }) eventType: string;
  @Column({ type: 'varchar', length: 30, default: 'pending' }) status:
    'pending' | 'sent' | 'failed';
  @Column({ type: 'varchar', length: 30, nullable: true }) channel:
    string | null;
  @Column({ type: 'text' }) message: string;
  @Column({ type: 'simple-json', nullable: true }) context: Record<
    string,
    unknown
  > | null;
  @Column({ type: 'text', nullable: true }) lastError: string | null;
  @Column({ type: 'int', default: 0 }) attempts: number;
  @CreateDateColumn() createdAt: Date;
  @UpdateDateColumn() updatedAt: Date;
}
