import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, of } from 'rxjs';
import { environment } from '@env/environment';
import { InventorySku } from '@shared/models/admin-enterprise.model';
import { AdminActivityService } from '@core/services/admin-activity.service';
import { AdminAuthService } from '@core/services/admin-auth.service';
import { StagingQueueService } from '@core/services/staging-queue.service';
import { StagingProduct } from '@shared/models/staging-product.model';
import { CATALOG_CATEGORIES } from '@shared/data/catalog-categories';
import { assetUrl } from '@shared/utils/asset-url';

export type InventorySmartFilter =
  | 'all'
  | 'missing_photo'
  | 'low_stock'
  | 'internal'
  | 'on_sale';

const STORAGE_KEY = 'mazhariAdminInventoryV1';

/**
 * انبار ادمین — همگام با محصولات منتشرشده صف Staging و localStorage.
 * HttpClient برای اتصال API آماده است.
 */
@Injectable({ providedIn: 'root' })
export class AdminInventoryService {
  private readonly activity = inject(AdminActivityService);
  private readonly auth = inject(AdminAuthService);
  private readonly staging = inject(StagingQueueService);
  private readonly http = inject(HttpClient);
  private readonly itemsSignal = signal<InventorySku[]>(this.loadLocal());

  readonly items = this.itemsSignal.asReadonly();
  readonly lowStockCount = computed(
    () => this.itemsSignal().filter((i) => i.stock > 0 && i.stock <= 3).length
  );

  readonly categoryCards = computed(() => {
    const items = this.itemsSignal();
    return CATALOG_CATEGORIES.map((cat) => {
      const products = items.filter(
        (i) =>
          i.parentCategorySlug === cat.slug ||
          i.categorySlug?.startsWith(cat.slug) ||
          cat.subcategories.some((s) => s.label === i.category || s.slug === i.categorySlug)
      );
      return {
        slug: cat.slug,
        title: cat.title,
        subtitle: cat.subtitle || '',
        image: assetUrl(cat.image),
        count: products.length
      };
    });
  });

  constructor() {
    // هر بار که محصولی منتشر می‌شود، انبار بلافاصله همگام می‌شود.
    effect(
      () => {
        const published = this.staging.published();
        this.syncFromStaging(published);
      },
      { allowSignalWrites: true }
    );
    this.http
      .get<InventorySku[]>(`${environment.apiBaseUrl}${environment.apiPath}/mazhari/v1/inventory`)
      .pipe(catchError(() => of(null)))
      .subscribe((remote) => {
        if (remote?.length) {
          this.itemsSignal.set(remote.map((i) => this.normalize(i)));
          this.persist();
        }
      });
  }

  filtered(filter: InventorySmartFilter, query = '', categorySlug?: string): InventorySku[] {
    const q = query.trim().toLowerCase();
    return this.itemsSignal().filter((item) => {
      if (categorySlug) {
        const hit =
          item.parentCategorySlug === categorySlug ||
          CATALOG_CATEGORIES.find((c) => c.slug === categorySlug)?.subcategories.some(
            (s) => s.slug === item.categorySlug || s.label === item.category
          );
        if (!hit) return false;
      }
      if (filter === 'missing_photo' && item.hasPhoto) return false;
      if (filter === 'low_stock' && !(item.stock > 0 && item.stock <= 3)) return false;
      if (filter === 'internal' && item.status !== 'internal') return false;
      if (filter === 'on_sale' && !item.onSale) return false;
      if (!q) return true;
      return (
        item.code.toLowerCase().includes(q) ||
        item.name.includes(query.trim()) ||
        item.category.includes(query.trim())
      );
    });
  }

  byCategorySlug(slug: string): InventorySku[] {
    return this.filtered('all', '', slug);
  }

  bulkDiscount(ids: string[], percent: number): void {
    this.itemsSignal.update((list) =>
      list.map((item) =>
        ids.includes(item.id)
          ? {
              ...item,
              onSale: true,
              discountPercent: percent,
              price: Math.round(item.price * (1 - percent / 100))
            }
          : item
      )
    );
    this.persist();
    this.log(`اعمال تخفیف ${percent}٪ روی ${ids.length} محصول`);
  }

  bulkOutOfStock(ids: string[]): void {
    this.itemsSignal.update((list) =>
      list.map((item) =>
        ids.includes(item.id)
          ? { ...item, stock: 0, status: 'out_of_stock' as const }
          : item
      )
    );
    this.persist();
    this.log(`تغییر وضعیت ${ids.length} محصول به ناموجود`);
  }

  bulkAddToSale(ids: string[]): void {
    this.itemsSignal.update((list) =>
      list.map((item) => (ids.includes(item.id) ? { ...item, onSale: true } : item))
    );
    this.persist();
    this.log(`افزودن ${ids.length} محصول به دسته حراج`);
  }

  private syncFromStaging(published: StagingProduct[]): void {
    if (!published.length) return;

    this.itemsSignal.update((current) => {
      const byCode = new Map(current.map((c) => [c.code.toUpperCase(), c]));
      for (const p of published) {
        const existing = byCode.get(p.code.toUpperCase());
        const next: InventorySku = {
          id: existing?.id || `inv-${p.code}`,
          code: p.code,
          name: p.name,
          category: p.category,
          parentCategorySlug: p.parentCategorySlug,
          categorySlug: p.categorySlug,
          price: existing?.price ?? 0,
          stock: p.stock,
          status: p.stock > 0 ? 'active' : 'out_of_stock',
          hasPhoto: (p.photos?.length || 0) > 0 || !!p.photoUrl,
          photoUrl: assetUrl(p.photos?.[0]?.url || p.photoUrl),
          onSale: existing?.onSale,
          discountPercent: existing?.discountPercent
        };
        byCode.set(p.code.toUpperCase(), next);
      }
      return [...byCode.values()];
    });
    this.persist();
  }

  private normalize(item: InventorySku): InventorySku {
    return {
      ...item,
      photoUrl: assetUrl(item.photoUrl)
    };
  }

  private loadLocal(): InventorySku[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw) as InventorySku[];
      return Array.isArray(parsed) ? parsed.map((i) => this.normalize(i)) : [];
    } catch {
      return [];
    }
  }

  private persist(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.itemsSignal()));
    } catch {
      // ignore
    }
  }

  private log(summary: string): void {
    const user = this.auth.user();
    this.activity.log({
      action: 'status_override',
      actor: user?.username || 'manager',
      actorRole: user?.role || 'manager',
      summary
    });
  }
}
