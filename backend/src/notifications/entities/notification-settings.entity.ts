import { Column, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm';

export type NotificationMode =
  'auto' | 'telegram' | 'sms' | 'both' | 'disabled';

@Entity('notification_settings')
export class NotificationSettingsEntity {
  @PrimaryColumn({ type: 'int', default: 1 }) id: number;
  @Column({ default: false }) enabled: boolean;
  @Column({ type: 'varchar', length: 20, default: 'disabled' })
  mode: NotificationMode;
  @Column({ type: 'varchar', length: 200, nullable: true }) telegramBotToken:
    string | null;
  @Column({ type: 'simple-json', nullable: true }) telegramChatIds:
    string[] | null;
  @Column({ type: 'varchar', length: 500, nullable: true }) smsApiUrl:
    string | null;
  @Column({ type: 'varchar', length: 500, nullable: true }) smsApiKey:
    string | null;
  @Column({ type: 'varchar', length: 80, nullable: true }) smsSender:
    string | null;
  @Column({ type: 'simple-json', nullable: true }) smsRecipients:
    string[] | null;
  @Column({ type: 'varchar', length: 50, default: 'Authorization' })
  smsAuthHeader: string;
  @Column({ type: 'varchar', length: 30, default: 'Bearer' })
  smsAuthScheme: string;
  @Column({ type: 'int', default: 8000 }) timeoutMs: number;
  @UpdateDateColumn() updatedAt: Date;
}
