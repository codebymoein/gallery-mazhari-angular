import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { catchError, of } from 'rxjs';
import { environment } from '@env/environment';
import {
  BridalOrder,
  BridalOrderStage,
  BridalShippingAddress,
  GALLERY_SENDER_ADDRESS,
  ORDER_STAGES
} from '@shared/models/admin-enterprise.model';

const STORAGE_KEY = 'mazhariAdminOrdersV1';

interface BackendAdminOrder {
  id: string;
  number: string;
  status: 'pending-payment' | 'processing' | 'preparing' | 'ready' | 'shipped' | 'completed' | 'cancelled';
  paymentStatus: 'pending' | 'paid' | 'failed' | 'cancelled' | 'refunded';
  lines: Array<{ code: string; name: string; quantity: number; unitPrice: number | string }>;
  customer: {
    firstName: string;
    lastName: string;
    phone: string;
    email: string;
    address: string;
    city: string;
    postalCode: string;
  };
  total: number | string;
  note: string | null;
  createdAt: string;
  updatedAt: string;
}

@Injectable({ providedIn: 'root' })
export class AdminOrdersService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.backendApiBaseUrl}/orders`;
  private readonly ordersSignal = signal<BridalOrder[]>(this.loadCache());

  readonly orders = this.ordersSignal.asReadonly();
  readonly senderAddress = GALLERY_SENDER_ADDRESS;
  readonly byStage = computed(() => {
    const map = {} as Record<BridalOrderStage, BridalOrder[]>;
    for (const stage of ORDER_STAGES) map[stage] = [];
    for (const order of this.ordersSignal()) map[order.stage].push(order);
    return map;
  });

  constructor() {
    this.refreshFromApi();
  }

  refreshFromApi(): void {
    this.http.get<BackendAdminOrder[]>(this.apiUrl)
      .pipe(catchError(() => of(null)))
      .subscribe(remote => {
        if (!remote) return;
        this.ordersSignal.set(remote.map(order => this.fromBackend(order)));
        this.persistCache();
      });
  }

  moveToStage(orderId: string, stage: BridalOrderStage): void {
    const previous = this.ordersSignal();
    this.ordersSignal.update(list => list.map(order =>
      order.id === orderId ? { ...order, stage, updatedAt: new Date().toISOString() } : order
    ));
    this.persistCache();
    this.http.patch<BackendAdminOrder>(`${this.apiUrl}/${orderId}/status`, {
      status: this.backendStatus(stage)
    }).subscribe({
      next: remote => {
        this.ordersSignal.update(list => list.map(order =>
          order.id === orderId ? this.fromBackend(remote) : order
        ));
        this.persistCache();
      },
      error: () => {
        this.ordersSignal.set(previous);
        this.persistCache();
      }
    });
  }

  bulkMoveToStage(orderIds: string[], stage: BridalOrderStage): number {
    const ids = new Set(orderIds);
    this.ordersSignal.update(list => list.map(order =>
      ids.has(order.id) ? { ...order, stage, updatedAt: new Date().toISOString() } : order
    ));
    this.persistCache();
    for (const id of orderIds) {
      this.http.patch(`${this.apiUrl}/${id}/status`, {
        status: this.backendStatus(stage)
      }).subscribe({ error: () => this.refreshFromApi() });
    }
    return orderIds.length;
  }

  getById(id: string): BridalOrder | undefined {
    return this.ordersSignal().find(order => order.id === id);
  }

  buildShippingLabel(order: BridalOrder): string {
    const address = order.shippingAddress;
    const receiver = address
      ? [
          `گیرنده: ${address.fullName}`,
          `تلفن: ${address.phone}`,
          `آدرس: ${address.city}، ${address.address}`,
          `کد پستی: ${address.postalCode || '—'}`
        ].join('\n')
      : `گیرنده: ${order.customerName}\nتلفن: ${order.customerPhone}`;
    return [
      'گالری مظهری — لیبل ارسال',
      `شماره سفارش: ${order.orderNo}`,
      '',
      'فرستنده:',
      this.senderAddress,
      '',
      receiver,
      '',
      `تاریخ: ${new Date().toLocaleString('fa-IR')}`
    ].join('\n');
  }

  private fromBackend(order: BackendAdminOrder): BridalOrder {
    const shippingAddress: BridalShippingAddress = {
      fullName: `${order.customer.firstName} ${order.customer.lastName}`.trim(),
      phone: order.customer.phone,
      address: order.customer.address,
      city: order.customer.city,
      postalCode: order.customer.postalCode
    };
    return {
      id: order.id,
      sourceOrderId: order.id,
      orderNo: order.number,
      customerName: shippingAddress.fullName,
      customerPhone: order.customer.phone,
      customerId: `crm-${order.customer.phone}`,
      stage: this.frontendStage(order.status),
      paymentStatus: order.paymentStatus === 'paid'
        ? 'paid'
        : order.paymentStatus === 'pending'
          ? 'pending'
          : 'refunded',
      total: Number(order.total),
      paidAmount: order.paymentStatus === 'paid' ? Number(order.total) : 0,
      notes: order.note || undefined,
      shippingAddress,
      lines: order.lines.map(line => ({
        productCode: line.code,
        name: line.name,
        qty: line.quantity,
        unitPrice: Number(line.unitPrice)
      })),
      createdAt: order.createdAt,
      updatedAt: order.updatedAt
    };
  }

  private frontendStage(status: BackendAdminOrder['status']): BridalOrderStage {
    if (status === 'ready') return 'ready';
    if (status === 'shipped' || status === 'completed' || status === 'cancelled') return 'delivered';
    if (status === 'preparing') return 'tailoring';
    return 'new';
  }

  private backendStatus(stage: BridalOrderStage): BackendAdminOrder['status'] {
    if (stage === 'ready') return 'ready';
    if (stage === 'delivered') return 'completed';
    if (stage === 'fitting' || stage === 'tailoring') return 'preparing';
    return 'processing';
  }

  private loadCache(): BridalOrder[] {
    try {
      const value = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      return Array.isArray(value) ? value : [];
    } catch {
      return [];
    }
  }

  private persistCache(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.ordersSignal()));
    } catch {
      // Cache failure must not affect server-side order operations.
    }
  }
}
