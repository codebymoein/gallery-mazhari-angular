import { Column, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm';

export type PaymentProvider = 'disabled' | 'zarinpal' | 'custom';

@Entity('payment_gateway_settings')
export class PaymentSettingsEntity {
  @PrimaryColumn({ type: 'int', default: 1 })
  id: number;

  @Column({ type: 'varchar', length: 20, default: 'disabled' })
  provider: PaymentProvider;

  @Column({ default: false })
  enabled: boolean;

  @Column({ type: 'varchar', length: 100, default: 'پرداخت آنلاین' })
  displayName: string;

  @Column({ type: 'varchar', length: 120, nullable: true })
  merchantId: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  customRequestUrl: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  customVerifyUrl: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  customPaymentUrlTemplate: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  customApiKey: string | null;

  @Column({ default: false })
  sandbox: boolean;

  @UpdateDateColumn()
  updatedAt: Date;
}
