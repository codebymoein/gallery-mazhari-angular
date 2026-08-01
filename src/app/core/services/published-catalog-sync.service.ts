import { Injectable, inject, signal } from '@angular/core';
import { catchError, of } from 'rxjs';
import { environment } from '@env/environment';
import {
  ProductsApiService,
  backendProductToStaging
} from '@core/services/products-api.service';

/**
 * سینک ویترین با سرور: لیست محصولات منتشرشده از API خوانده و در localStorage
 * کش می‌شود تا کاتالوگ عمومی (published-products.ts) روی هر دستگاهی همان
 * محصولات را نشان دهد. اگر سرور در دسترس نباشد، کش قبلی یا حالت محلی می‌ماند.
 */
@Injectable({ providedIn: 'root' })
export class PublishedCatalogSyncService {
  private readonly api = inject(ProductsApiService);
  private readonly cacheKey = environment.storageKeys.publishedProducts;
  readonly version = signal(0);

  getCachedProductCodes(): string[] {
    try {
      const parsed = JSON.parse(localStorage.getItem(this.cacheKey) || '[]') as Array<{
        code?: string;
      }>;
      return Array.isArray(parsed)
        ? parsed.map(item => item.code || '').filter(Boolean)
        : [];
    } catch {
      return [];
    }
  }

  refresh(): void {
    this.api
      .getPublished()
      .pipe(catchError(() => of(null)))
      .subscribe((items) => {
        if (!items) {
          return;
        }
        try {
          localStorage.setItem(
            this.cacheKey,
            JSON.stringify(
              items.map(item => backendProductToStaging(item))
            )
          );
          this.version.update(value => value + 1);
        } catch (err) {
          console.warn('PublishedCatalogSync: cache write failed', err);
        }
      });
  }
}
