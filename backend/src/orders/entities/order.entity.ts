import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  VersionColumn,
} from 'typeorm';

export type OrderStatus =
  | 'pending-payment'
  | 'processing'
  | 'preparing'
  | 'ready'
  | 'shipped'
  | 'completed'
  | 'cancelled';

export type OrderPaymentStatus =
  'pending' | 'paid' | 'failed' | 'cancelled' | 'refunded';

export interface OrderLine {
  productId: string;
  code: string;
  name: string;
  image: string | null;
  quantity: number;
  unitPrice: number;
  customization?: 'engraving' | 'veil-print';
  rental?: {
    ceremonyDate: string;
    returnDueDate: string;
    refundAmount: number;
    rentalFee: number;
  };
}

export interface OrderCustomer {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  city: string;
  address: string;
  postalCode: string;
}

@Entity('orders')
@Index('idx_orders_number', ['number'], { unique: true })
@Index('idx_orders_phone', ['customerPhone'])
@Index('idx_orders_status', ['status'])
export class OrderEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 30, unique: true })
  number: string;

  @Column({ type: 'varchar', length: 30, default: 'pending-payment' })
  status: OrderStatus;

  @Column({ type: 'varchar', length: 20, default: 'pending' })
  paymentStatus: OrderPaymentStatus;

  @Column({ type: 'simple-json' })
  lines: OrderLine[];

  @Column({ type: 'simple-json' })
  customer: OrderCustomer;

  @Column({ type: 'varchar', length: 20 })
  customerPhone: string;

  @Column({ type: 'bigint' })
  subtotal: number;

  @Column({ type: 'bigint' })
  shipping: number;

  @Column({ type: 'bigint' })
  total: number;

  @Column({ type: 'varchar', length: 20 })
  shippingMethod: 'standard' | 'express' | 'pickup';

  @Column({ type: 'varchar', length: 500, nullable: true })
  note: string | null;

  @Column({ type: 'varchar', length: 120, nullable: true })
  paymentReference: string | null;

  @Column({ type: 'varchar', length: 64, select: false })
  trackingTokenHash: string;

  @Column({ default: true })
  stockReserved: boolean;

  @Column({ type: 'varchar', length: 40, nullable: true })
  paidAt: string | null;

  @Column({ type: 'varchar', length: 40, nullable: true })
  cancelledAt: string | null;

  @VersionColumn()
  version: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
