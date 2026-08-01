import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import type { OrderCustomer } from '../../orders/entities/order.entity';

@Entity('payment_transactions')
@Index('idx_payment_authority', ['authority'])
export class PaymentTransactionEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 30, unique: true })
  orderNumber: string;

  @Column({ type: 'varchar', length: 36, nullable: true })
  orderId: string | null;

  @Column({ type: 'varchar', length: 20 })
  provider: string;

  @Column({ type: 'bigint' })
  amount: number;

  @Column({ type: 'varchar', length: 120, nullable: true })
  authority: string | null;

  @Column({ type: 'varchar', length: 30, default: 'created' })
  status: 'created' | 'redirected' | 'paid' | 'failed' | 'cancelled';

  @Column({ type: 'varchar', length: 120, nullable: true })
  referenceId: string | null;

  @Column({ type: 'simple-json' })
  items: Array<{ code: string; quantity: number; unitPrice: number }>;

  @Column({ type: 'simple-json', nullable: true })
  customer: OrderCustomer | null;

  @Column({ type: 'simple-json', nullable: true })
  gatewayResponse: Record<string, unknown> | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
