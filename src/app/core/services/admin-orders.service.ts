import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, of } from 'rxjs';
import { environment } from '@env/environment';
import {
  BridalOrder,
  BridalOrderStage,
  BridalShippingAddress,
  GALLERY_SENDER_ADDRESS,
  ORDER_STAGES
} from '@shared/models/admin-enterprise.model';
import { LocalOrder, OrderService } from '@core/services/order.service';

const STORAGE_KEY = 'mazhariAdminOrdersV1';

/**
 * سفارش‌های کانبان — منبع حقیقت: سفارش‌های فروشگاه + localStorage.
 * HttpClient آماده است؛ در صورت در دسترس نبودن API از داده محلی استفاده می‌شود.
 */
@Injectable({ providedIn: 'root' })
export class AdminOrdersService {
  private readonly http = inject(HttpClient);
  private readonly storefrontOrders = inject(OrderService);
  private readonly ordersSignal = signal<BridalOrder[]>(this.loadLocal());

  readonly orders = this.ordersSignal.asReadonly();
  readonly senderAddress = GALLERY_SENDER_ADDRESS;

  readonly byStage = computed(() => {
    const map = {} as Record<BridalOrderStage, BridalOrder[]>;
    for (const stage of ORDER_STAGES) map[stage] = [];
    for (const order of this.ordersSignal()) {
      map[order.stage].push(order);
    }
    return map;
  });

  constructor() {
    this.syncFromStorefront();
    this.storefrontOrders.orders$.subscribe(() => this.syncFromStorefront());
    this.refreshFromApi();
  }

  refreshFromApi(): void {
    this.http
      .get<BridalOrder[]>(`${environment.apiBaseUrl}${environment.apiPath}/mazhari/v1/orders`)
      .pipe(catchError(() => of(null)))
      .subscribe((remote) => {
        if (remote && Array.isArray(remote) && remote.length) {
          this.ordersSignal.set(remote.map((o) => this.normalize(o)));
          this.persist();
        }
      });
  }

  moveToStage(orderId: string, stage: BridalOrderStage): void {
    this.ordersSignal.update((list) =>
      list.map((o) =>
        o.id === orderId ? { ...o, stage, updatedAt: new Date().toISOString() } : o
      )
    );
    this.persist();
  }

  bulkMoveToStage(orderIds: string[], stage: BridalOrderStage): number {
    const set = new Set(orderIds);
    let count = 0;
    this.ordersSignal.update((list) =>
      list.map((o) => {
        if (!set.has(o.id)) return o;
        count += 1;
        return { ...o, stage, updatedAt: new Date().toISOString() };
      })
    );
    this.persist();
    return count;
  }

  getById(id: string): BridalOrder | undefined {
    return this.ordersSignal().find((o) => o.id === id);
  }

  buildShippingLabel(order: BridalOrder): string {
    const recv = order.shippingAddress;
    const receiverBlock = recv
      ? [
          `گیرنده: ${recv.fullName}`,
          `تلفن: ${recv.phone}`,
          `آدرس: ${recv.city}، ${recv.address}`,
          `کد پستی: ${recv.postalCode || '—'}`
        ].join('\n')
      : [
          `گیرنده: ${order.customerName}`,
          `تلفن: ${order.customerPhone}`,
          'آدرس: ثبت‌نشده در سفارش'
        ].join('\n');

    return [
      '══════════════════════════════════════',
      '   گالری مظهری — لیبل ارسال',
      '══════════════════════════════════════',
      `شماره سفارش: ${order.orderNo}`,
      '',
      '—— فرستنده ——',
      this.senderAddress,
      '',
      '—— گیرنده ——',
      receiverBlock,
      '',
      `تاریخ: ${new Date().toLocaleString('fa-IR')}`,
      '══════════════════════════════════════'
    ].join('\n');
  }

  private syncFromStorefront(): void {
    const local = this.storefrontOrders.getOrders();
    if (!local.length) return;

    this.ordersSignal.update((current) => {
      const bySource = new Map(
        current.filter((c) => c.sourceOrderId).map((c) => [c.sourceOrderId!, c])
      );
      const merged = [...current];

      for (const lo of local) {
        const existing = bySource.get(lo.id);
        const mapped = this.fromLocalOrder(lo, existing);
        if (existing) {
          const idx = merged.findIndex((m) => m.id === existing.id);
          if (idx >= 0) merged[idx] = { ...mapped, stage: existing.stage, id: existing.id };
        } else {
          merged.unshift(mapped);
        }
      }
      return merged;
    });
    this.persist();
  }

  private fromLocalOrder(lo: LocalOrder, existing?: BridalOrder): BridalOrder {
    const shipping: BridalShippingAddress = {
      fullName: `${lo.customer.firstName} ${lo.customer.lastName}`.trim(),
      phone: lo.customer.phone,
      address: lo.customer.address,
      city: lo.customer.city,
      postalCode: lo.customer.postalCode
    };

    const stage: BridalOrderStage =
      existing?.stage ||
      (lo.status === 'completed' || lo.status === 'shipped'
        ? 'delivered'
        : lo.status === 'processing'
          ? 'tailoring'
          : 'new');

    return {
      id: existing?.id || `adm-${lo.id}`,
      sourceOrderId: lo.id,
      orderNo: lo.number,
      customerName: shipping.fullName,
      customerPhone: lo.customer.phone,
      customerId: `crm-${lo.customer.phone}`,
      stage,
      paymentStatus:
        lo.status === 'pending-payment'
          ? 'pending'
          : lo.status === 'cancelled'
            ? 'refunded'
            : 'paid',
      total: lo.total,
      paidAmount: lo.status === 'pending-payment' ? 0 : lo.total,
      notes: lo.note,
      shippingAddress: shipping,
      lines: lo.items.map((i) => ({
        productCode: String(i.product_id),
        name: i.product_name || `محصول ${i.product_id}`,
        qty: i.quantity,
        unitPrice: i.price
      })),
      createdAt: lo.createdAt,
      updatedAt: new Date().toISOString()
    };
  }

  private normalize(o: BridalOrder): BridalOrder {
    return {
      ...o,
      lines: o.lines || [],
      shippingAddress: o.shippingAddress
    };
  }

  private loadLocal(): BridalOrder[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw) as BridalOrder[];
      return Array.isArray(parsed) ? parsed.map((o) => this.normalize(o)) : [];
    } catch {
      return [];
    }
  }

  private persist(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.ordersSignal()));
    } catch {
      // ignore
    }
  }
}
