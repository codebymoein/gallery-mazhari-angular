import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { CartItem } from '@shared/models';

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
    totals: { subtotal: number; shipping: number; total: number }
  ): LocalOrder {
    const order: LocalOrder = {
      id: crypto.randomUUID(),
      number: this.nextOrderNumber(),
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
        return 350_000;
      case 'pickup':
        return 0;
      default:
        return 180_000;
    }
  }

  shippingLabel(method: CheckoutDraft['shippingMethod']): string {
    switch (method) {
      case 'express':
        return 'ارسال سریع (۱–۲ روز کاری)';
      case 'pickup':
        return 'تحویل حضوری از شعبه';
      default:
        return 'ارسال عادی (۳–۵ روز کاری)';
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
}
