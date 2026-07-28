import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, of } from 'rxjs';
import { environment } from '@env/environment';
import { CrmClient } from '@shared/models/admin-enterprise.model';
import { AdminOrdersService } from '@core/services/admin-orders.service';
import { ConsultationService } from '@core/services/consultation.service';
import { assetUrl } from '@shared/utils/asset-url';

const STORAGE_KEY = 'mazhariAdminCrmV1';

/**
 * CRM — ساخته‌شده از سفارش‌ها و درخواست‌های مشاوره واقعی (بدون mock seed).
 */
@Injectable({ providedIn: 'root' })
export class AdminCrmService {
  private readonly orders = inject(AdminOrdersService);
  private readonly consultation = inject(ConsultationService);
  private readonly http = inject(HttpClient);
  private readonly clientsSignal = signal<CrmClient[]>(this.loadLocal());

  readonly clients = this.clientsSignal.asReadonly();
  readonly totalLtv = computed(() =>
    this.clientsSignal().reduce((sum, c) => sum + c.ltv, 0)
  );

  constructor() {
    this.rebuildFromSources();
    this.http
      .get<CrmClient[]>(`${environment.apiBaseUrl}${environment.apiPath}/mazhari/v1/crm`)
      .pipe(catchError(() => of(null)))
      .subscribe((remote) => {
        if (remote?.length) {
          this.clientsSignal.set(remote);
          this.persist();
        }
      });
  }

  getById(id: string): CrmClient | undefined {
    return this.clientsSignal().find((c) => c.id === id);
  }

  search(query: string): CrmClient[] {
    const q = query.trim().toLowerCase();
    if (!q) return this.clientsSignal();
    return this.clientsSignal().filter(
      (c) =>
        c.name.includes(query.trim()) ||
        c.phone.includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.city.includes(query.trim())
    );
  }

  rebuildFromSources(): void {
    const byPhone = new Map<string, CrmClient>();

    for (const order of this.orders.orders()) {
      const phone = order.customerPhone;
      const existing = byPhone.get(phone);
      const next: CrmClient = {
        id: existing?.id || order.customerId || `crm-${phone}`,
        name: order.customerName,
        phone,
        email: existing?.email || '',
        city: order.shippingAddress?.city || existing?.city || '',
        ltv: (existing?.ltv || 0) + order.total,
        ordersCount: (existing?.ordersCount || 0) + 1,
        lastVisitAt: order.updatedAt,
        ceremonyDate: order.ceremonyDate || existing?.ceremonyDate,
        tags: existing?.tags?.length ? existing.tags : ['مشتری'],
        dreamBoard: existing?.dreamBoard || [],
        appointments: existing?.appointments || []
      };
      byPhone.set(phone, next);
    }

    for (const req of this.consultation.getRequests()) {
      const phone = req.phone;
      const existing = byPhone.get(phone);
      byPhone.set(phone, {
        id: existing?.id || `crm-${phone}`,
        name: existing?.name || req.last_name,
        phone,
        email: existing?.email || '',
        city: existing?.city || '',
        ltv: existing?.ltv || 0,
        ordersCount: existing?.ordersCount || 0,
        lastVisitAt: req.created_at,
        ceremonyDate: req.ceremony_date || existing?.ceremonyDate,
        tags: [...new Set([...(existing?.tags || []), 'مشاوره'])],
        dreamBoard: existing?.dreamBoard || [],
        appointments: existing?.appointments || []
      });
    }

    const merged = [...byPhone.values()].map((c) => ({
      ...c,
      dreamBoard: c.dreamBoard.map((d) => ({ ...d, image: assetUrl(d.image) }))
    }));

    if (merged.length) {
      this.clientsSignal.set(merged);
      this.persist();
    }
  }

  private loadLocal(): CrmClient[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw) as CrmClient[];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  private persist(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.clientsSignal()));
    } catch {
      // ignore
    }
  }
}
