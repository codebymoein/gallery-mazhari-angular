import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '@env/environment';
import { InventorySku } from '@shared/models/admin-enterprise.model';
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

interface BulkProductDiscountResult {
  updated: number;
  percent: number;
  productIds: string[];
}

/**
 * نمای عملیاتی انبار ادمین. وضعیت ماندگار محصول فقط از API/Staging سرور می‌آید؛
 * این سرویس هیچ localStorage یا write fallback برای داده‌های کسب‌وکار ندارد.
 */
@Injectable({ providedIn: 'root' })
export class AdminInventoryService {
  private readonly staging = inject(StagingQueueService);
  private readonly http = inject(HttpClient);
  private readonly itemsSignal = signal<InventorySku[]>([]);

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
    effect(
      () => {
        const catalogue = this.staging.items();
        this.syncFromStaging(catalogue);
      },
      { allowSignalWrites: true }
    );
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

  bulkDiscount(ids: string[], percent: number): Observable<BulkProductDiscountResult> {
    return this.http
      .post<BulkProductDiscountResult>(
        `${environment.apiBaseUrl}${environment.apiPath}/discounts/rules/bulk-products`,
        { productIds: ids, percent }
      )
      .pipe(
        tap((result) => {
          const updated = new Set(result.productIds);
          this.itemsSignal.update((list) =>
            list.map((item) =>
              updated.has(item.id)
                ? { ...item, onSale: true, discountPercent: result.percent }
                : item
            )
          );
        })
      );
  }

  private syncFromStaging(catalogue: StagingProduct[]): void {
    this.itemsSignal.update((current) => {
      const currentById = new Map(current.map((item) => [item.id, item]));
      return catalogue.map((p) => {
        const existing = currentById.get(p.id);
        return {
          id: p.id,
          code: p.code,
          name: p.name,
          category: p.category,
          parentCategorySlug: p.parentCategorySlug,
          categorySlug: p.categorySlug,
          price: p.salePrice ?? p.price ?? 0,
          stock: p.stock,
          status: p.stock > 0 ? ('active' as const) : ('out_of_stock' as const),
          hasPhoto: (p.photos?.length || 0) > 0 || !!p.photoUrl,
          photoUrl: assetUrl(p.photos?.[0]?.url || p.photoUrl),
          onSale: p.discountPercent ? true : existing?.onSale,
          discountPercent: p.discountPercent ?? existing?.discountPercent
        };
      });
    });
  }
}
