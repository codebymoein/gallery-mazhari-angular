import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, of } from 'rxjs';
import { environment } from '@env/environment';
import { AbandonedCart, PromoCode } from '@shared/models/admin-enterprise.model';
import { AdminActivityService } from '@core/services/admin-activity.service';
import { AdminAuthService } from '@core/services/admin-auth.service';

const PROMO_KEY = 'mazhariAdminPromosV1';
const CARTS_KEY = 'mazhariAdminAbandonedCartsV1';

export interface ResolvedDiscount {
  code: string;
  type: 'percent' | 'fixed';
  percent: number;
  amount: number;
}

@Injectable({ providedIn: 'root' })
export class AdminMarketingService {
  private readonly activity = inject(AdminActivityService);
  private readonly auth = inject(AdminAuthService);
  private readonly http = inject(HttpClient);

  private readonly promosSignal = signal<PromoCode[]>(this.loadPromos());
  private readonly cartsSignal = signal<AbandonedCart[]>(this.loadCarts());

  readonly promos = this.promosSignal.asReadonly();
  readonly abandonedCarts = this.cartsSignal.asReadonly();
  readonly activePromoCount = computed(
    () => this.promosSignal().filter((p) => p.active).length
  );

  constructor() {
    this.http
      .get<PromoCode[]>(`${environment.apiBaseUrl}${environment.apiPath}/mazhari/v1/promos`)
      .pipe(catchError(() => of(null)))
      .subscribe((remote) => {
        if (remote?.length) {
          this.promosSignal.set(remote);
          this.persistPromos();
        }
      });
  }

  /** اعتبارسنجی کد تخفیف برای چک‌اوت / سبد */
  resolveDiscount(code: string, subtotal: number): ResolvedDiscount | null {
    const normalized = code.trim().toUpperCase();
    if (!normalized || subtotal <= 0) return null;

    const promo = this.promosSignal().find(
      (p) => p.active && p.code.toUpperCase() === normalized
    );
    if (!promo) return null;

    const now = Date.now();
    if (new Date(promo.startsAt).getTime() > now) return null;
    if (new Date(promo.endsAt).getTime() < now) return null;
    if (promo.usedCount >= promo.usageLimit) return null;

    if (promo.type === 'percent') {
      const amount = Math.round(subtotal * (promo.value / 100));
      return { code: promo.code, type: 'percent', percent: promo.value, amount };
    }

    const amount = Math.min(promo.value, subtotal);
    const percent = subtotal > 0 ? Math.round((amount / subtotal) * 100) : 0;
    return { code: promo.code, type: 'fixed', percent, amount };
  }

  createPromo(input: Omit<PromoCode, 'id' | 'usedCount' | 'active'>): void {
    const promo: PromoCode = {
      ...input,
      id: `promo-${Date.now()}`,
      usedCount: 0,
      active: true
    };
    this.promosSignal.update((list) => [promo, ...list]);
    this.persistPromos();
    const user = this.auth.user();
    this.activity.log({
      action: 'import',
      actor: user?.username || 'manager',
      actorRole: user?.role || 'manager',
      summary: `کد تخفیف ${promo.code} ساخته شد`
    });
  }

  togglePromo(id: string): void {
    this.promosSignal.update((list) =>
      list.map((p) => (p.id === id ? { ...p, active: !p.active } : p))
    );
    this.persistPromos();
  }

  sendCartReminder(cartId: string): { ok: true; message: string } {
    const cart = this.cartsSignal().find((c) => c.id === cartId);
    if (!cart) return { ok: true, message: 'سبد یافت نشد.' };
    const channel = cart.channelHint === 'telegram' ? 'تلگرام' : 'پیامک';
    const user = this.auth.user();
    this.activity.log({
      action: 'status_override',
      actor: user?.username || 'staff',
      actorRole: user?.role || 'staff',
      summary: `یادآور ${channel} برای سبد رهاشده ${cart.customerName} ارسال شد`
    });
    this.cartsSignal.update((list) => list.filter((c) => c.id !== cartId));
    this.persistCarts();
    return {
      ok: true,
      message: `یادآور از طریق ${channel} برای ${cart.customerName} ارسال شد.`
    };
  }

  private loadPromos(): PromoCode[] {
    try {
      const raw = localStorage.getItem(PROMO_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw) as PromoCode[];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  private loadCarts(): AbandonedCart[] {
    try {
      const raw = localStorage.getItem(CARTS_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw) as AbandonedCart[];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  private persistPromos(): void {
    try {
      localStorage.setItem(PROMO_KEY, JSON.stringify(this.promosSignal()));
    } catch {
      // ignore
    }
  }

  private persistCarts(): void {
    try {
      localStorage.setItem(CARTS_KEY, JSON.stringify(this.cartsSignal()));
    } catch {
      // ignore
    }
  }
}
