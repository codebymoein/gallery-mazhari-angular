import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable, tap, throwError } from 'rxjs';
import { CartItem } from '@shared/models';
import { environment } from '@env/environment';

export type LocalOrderStatus =
  | 'pending-payment'
  | 'processing'
  | 'shipped'
  | 'completed'
  | 'cancelled';

export interface LocalOrder {
  id: string;
  number: string;
  createdAt: string;
  status: LocalOrderStatus;
  items: CartItem[];
  subtotal: number;
  shipping: number;
  total: number;
  shippingMethod: string;
  paymentMethod: string;
  customer: {
    firstName: string;
    lastName: string;
    phone: string;
    email: string;
    address: string;
    city: string;
    postalCode: string;
  };
  note?: string;
  trackingToken?: string;
}

export interface CheckoutDraft {
  step: 1 | 2 | 3;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  postalCode: string;
  shippingMethod: 'express' | 'standard' | 'pickup';
  paymentMethod: 'online';
  note: string;
}

const STATUS_LABELS: Record<LocalOrderStatus, string> = {
  'pending-payment': 'در انتظار پرداخت',
  processing: 'در حال آماده‌سازی',
  shipped: 'ارسال‌شده',
  completed: 'تکمیل‌شده',
  cancelled: 'لغوشده'
};

@Injectable({ providedIn: 'root' })
export class OrderService {
  private readonly http = inject(HttpClient);
  private readonly storageKey = 'mazhari_orders_v1';
  private readonly draftKey = 'mazhari_checkout_draft_v1';
  private readonly ordersSubject = new BehaviorSubject<LocalOrder[]>(this.readOrders());

  readonly orders$: Observable<LocalOrder[]> = this.ordersSubject.asObservable();

  statusLabel(status: LocalOrderStatus): string {
    return STATUS_LABELS[status];
  }

  getOrders(): LocalOrder[] {
    return this.ordersSubject.value;
  }

  getOrderById(id: string): LocalOrder | undefined {
    return this.getOrders().find(o => o.id === id || o.number === id);
  }

  createOrderFromCheckout(
    draft: CheckoutDraft,
    items: CartItem[],
    totals: { subtotal: number; shipping: number; total: number },
    orderNumber?: string,
    trackingToken?: string
  ): LocalOrder {
    const order: LocalOrder = {
      id: crypto.randomUUID(),
      number: orderNumber || this.nextOrderNumber(),
      createdAt: new Date().toISOString(),
      status: 'pending-payment',
      items: items.map(i => ({ ...i })),
      subtotal: totals.subtotal,
      shipping: totals.shipping,
      total: totals.total,
      shippingMethod: this.shippingLabel(draft.shippingMethod),
      paymentMethod: 'درگاه بانکی',
      customer: {
        firstName: draft.firstName.trim(),
        lastName: draft.lastName.trim(),
        phone: draft.phone.trim(),
        email: draft.email.trim(),
        address: draft.address.trim(),
        city: draft.city.trim(),
        postalCode: draft.postalCode.trim()
      },
      note: draft.note.trim() || undefined
      ,
      trackingToken
    };

    const next = [order, ...this.getOrders()].slice(0, 50);
    this.persist(next);
    this.clearDraft();
    return order;
  }

  updateStatus(orderId: string, status: LocalOrderStatus): void {
    const next = this.getOrders().map(o =>
      o.id === orderId ? { ...o, status } : o
    );
    this.persist(next);
  }

  refreshOrder(order: LocalOrder): Observable<BackendOrder> {
    if (!order.trackingToken) {
      return throwError(() => new Error('order_tracking_token_missing'));
    }
    return this.http.get<BackendOrder>(
      `${environment.backendApiBaseUrl}/orders/track/${encodeURIComponent(order.number)}`,
      { headers: new HttpHeaders({ 'X-Order-Token': order.trackingToken }) }
    ).pipe(
      tap(remote => {
        const next = this.getOrders().map(item =>
          item.id === order.id
            ? {
                ...item,
                status: this.mapRemoteStatus(remote.status),
                total: Number(remote.total),
                subtotal: Number(remote.subtotal),
                shipping: Number(remote.shipping)
              }
            : item
        );
        this.persist(next);
      })
    );
  }

  saveDraft(draft: CheckoutDraft): void {
    try {
      localStorage.setItem(this.draftKey, JSON.stringify(draft));
    } catch {
      // ignore
    }
  }

  loadDraft(): CheckoutDraft {
    try {
      const raw = localStorage.getItem(this.draftKey);
      if (raw) {
        return { ...this.emptyDraft(), ...JSON.parse(raw) };
      }
    } catch {
      // ignore
    }
    return this.emptyDraft();
  }

  clearDraft(): void {
    try {
      localStorage.removeItem(this.draftKey);
    } catch {
      // ignore
    }
  }

  emptyDraft(): CheckoutDraft {
    return {
      step: 1,
      firstName: '',
      lastName: '',
      phone: '',
      email: '',
      address: '',
      city: 'تهران',
      postalCode: '',
      shippingMethod: 'standard',
      paymentMethod: 'online',
      note: ''
    };
  }

  shippingCost(method: CheckoutDraft['shippingMethod']): number {
    switch (method) {
      case 'express':
        return 0;
      case 'pickup':
        return 0;
      default:
        return 2_500_000;
    }
  }

  shippingLabel(method: CheckoutDraft['shippingMethod']): string {
    switch (method) {
      case 'express':
        return 'تیپاکس — پس‌کرایه';
      case 'pickup':
        return 'پیک سریع — هزینه با مشتری';
      default:
        return 'پست پیشتاز — ۲٬۵۰۰٬۰۰۰ ریال';
    }
  }

  private nextOrderNumber(): string {
    const n = 1000 + this.getOrders().length + Math.floor(Math.random() * 80);
    return `GM-${n}`;
  }

  private readOrders(): LocalOrder[] {
    try {
      const raw = localStorage.getItem(this.storageKey);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  private persist(orders: LocalOrder[]): void {
    this.ordersSubject.next(orders);
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(orders));
    } catch {
      // ignore
    }
  }

  private mapRemoteStatus(status: BackendOrder['status']): LocalOrderStatus {
    switch (status) {
      case 'processing':
      case 'preparing':
      case 'ready':
        return 'processing';
      case 'shipped':
        return 'shipped';
      case 'completed':
        return 'completed';
      case 'cancelled':
        return 'cancelled';
      default:
        return 'pending-payment';
    }
  }
}

export interface BackendOrder {
  id: string;
  number: string;
  status: 'pending-payment' | 'processing' | 'preparing' | 'ready' | 'shipped' | 'completed' | 'cancelled';
  paymentStatus: 'pending' | 'paid' | 'failed' | 'cancelled' | 'refunded';
  subtotal: number | string;
  shipping: number | string;
  total: number | string;
}
