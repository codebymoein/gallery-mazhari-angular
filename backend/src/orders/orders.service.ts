import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  Optional,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { createHash, randomBytes } from 'crypto';
import { DataSource, LessThan, Repository } from 'typeorm';
import { ProductEntity } from '../products/entities/product.entity';
import {
  OrderCustomer,
  OrderEntity,
  OrderLine,
  OrderPaymentStatus,
  OrderStatus,
} from './entities/order.entity';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(OrderEntity)
    private readonly orders: Repository<OrderEntity>,
    private readonly dataSource: DataSource,
    @Optional() private readonly notifications?: NotificationsService,
  ) {}

  async createPending(input: {
    number: string;
    lines: OrderLine[];
    customer: OrderCustomer;
    subtotal: number;
    shipping: number;
    total: number;
    shippingMethod: 'standard' | 'express' | 'pickup';
    note?: string;
  }): Promise<{ order: OrderEntity; trackingToken: string }> {
    const trackingToken = randomBytes(32).toString('base64url');
    const trackingTokenHash = this.hashToken(trackingToken);

    const order = await this.dataSource.transaction(async (manager) => {
      for (const line of input.lines) {
        const result = await manager
          .createQueryBuilder()
          .update(ProductEntity)
          .set({ stock: () => `"stock" - ${line.quantity}` })
          .where('id = :id', { id: line.productId })
          .andWhere('status = :status', { status: 'published' })
          .andWhere('stock >= :quantity', { quantity: line.quantity })
          .execute();
        if (result.affected !== 1) {
          throw new ConflictException(`insufficient_stock:${line.code}`);
        }
      }

      return manager.save(
        manager.create(OrderEntity, {
          number: input.number,
          status: 'pending-payment',
          paymentStatus: 'pending',
          lines: input.lines,
          customer: input.customer,
          customerPhone: input.customer.phone,
          subtotal: input.subtotal,
          shipping: input.shipping,
          total: input.total,
          shippingMethod: input.shippingMethod,
          note: input.note?.trim().slice(0, 500) || null,
          paymentReference: null,
          trackingTokenHash,
          stockReserved: true,
          paidAt: null,
          cancelledAt: null,
        }),
      );
    });

    return { order, trackingToken };
  }

  async markPaymentResult(
    orderId: string,
    paymentStatus: Extract<OrderPaymentStatus, 'paid' | 'failed' | 'cancelled'>,
    reference: string | null,
  ): Promise<OrderEntity> {
    const existing = await this.orders.findOne({ where: { id: orderId } });
    if (!existing) throw new NotFoundException('order_not_found');
    if (existing.paymentStatus === 'paid') return existing;
    const result = await this.dataSource.transaction(async (manager) => {
      const order = await manager.findOne(OrderEntity, {
        where: { id: orderId },
      });
      if (!order) throw new NotFoundException('order_not_found');
      if (order.paymentStatus === 'paid') return order;

      if (paymentStatus === 'paid') {
        order.paymentStatus = 'paid';
        order.paymentReference = reference;
        order.status = 'processing';
        order.paidAt = new Date().toISOString();
        return manager.save(order);
      }

      if (order.stockReserved) {
        for (const line of order.lines) {
          await manager.increment(
            ProductEntity,
            { id: line.productId },
            'stock',
            line.quantity,
          );
        }
        order.stockReserved = false;
      }
      order.paymentStatus = paymentStatus;
      order.status = 'cancelled';
      order.cancelledAt = new Date().toISOString();
      return manager.save(order);
    });
    if (paymentStatus === 'paid' && result.paymentStatus === 'paid') {
      const lines = result.lines
        .map(
          (line) =>
            `• ${line.name} | ${line.code} | ${line.quantity} × ${line.unitPrice.toLocaleString('fa-IR')} ریال`,
        )
        .join('\n');
      void this.notifications?.notify(
        'order.paid',
        [
          '🛒 سفارش پرداخت‌شده جدید',
          `شماره سفارش: ${result.number}`,
          `کد پیگیری پرداخت: ${result.paymentReference || '-'}`,
          `مشتری: ${result.customer.firstName} ${result.customer.lastName}`,
          `موبایل: ${result.customer.phone}`,
          `ایمیل: ${result.customer.email || '-'}`,
          `شهر: ${result.customer.city}`,
          `آدرس: ${result.customer.address}`,
          `کد پستی: ${result.customer.postalCode || '-'}`,
          `روش ارسال: ${result.shippingMethod}`,
          `اقلام:\n${lines}`,
          `هزینه ارسال: ${Number(result.shipping).toLocaleString('fa-IR')} ریال`,
          `مبلغ کل: ${Number(result.total).toLocaleString('fa-IR')} ریال`,
          `یادداشت: ${result.note || '-'}`,
        ].join('\n'),
        { orderId: result.id, orderNumber: result.number },
      );
    }
    return result;
  }

  async releaseAfterGatewayFailure(orderId: string): Promise<void> {
    await this.markPaymentResult(orderId, 'failed', null);
  }

  async expirePendingReservations(maxAgeMinutes = 30): Promise<number> {
    const cutoff = new Date(Date.now() - maxAgeMinutes * 60_000);
    const expired = await this.orders.find({
      where: {
        status: 'pending-payment',
        paymentStatus: 'pending',
        createdAt: LessThan(cutoff),
      },
      take: 100,
    });
    for (const order of expired) {
      await this.markPaymentResult(order.id, 'cancelled', null);
    }
    return expired.length;
  }

  async getPublic(number: string, token: string): Promise<OrderEntity> {
    if (!token) throw new NotFoundException('order_not_found');
    const order = await this.orders
      .createQueryBuilder('order')
      .addSelect('order.trackingTokenHash')
      .where('order.number = :number', { number })
      .getOne();
    if (!order || order.trackingTokenHash !== this.hashToken(token)) {
      throw new NotFoundException('order_not_found');
    }
    return this.publicOrder(order);
  }

  listAdmin(): Promise<OrderEntity[]> {
    return this.orders.find({ order: { createdAt: 'DESC' }, take: 500 });
  }

  async updateStatus(id: string, status: OrderStatus): Promise<OrderEntity> {
    const order = await this.orders.findOne({ where: { id } });
    if (!order) throw new NotFoundException('order_not_found');
    if (order.paymentStatus !== 'paid' && status !== 'cancelled') {
      throw new BadRequestException('unpaid_order_cannot_be_fulfilled');
    }
    if (order.status === 'completed' || order.status === 'cancelled') {
      throw new BadRequestException('terminal_order_status');
    }
    order.status = status;
    if (status === 'cancelled') order.cancelledAt = new Date().toISOString();
    return this.orders.save(order);
  }

  private publicOrder(order: OrderEntity): OrderEntity {
    const { trackingTokenHash: _secret, ...safe } = order;
    return safe as OrderEntity;
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }
}
