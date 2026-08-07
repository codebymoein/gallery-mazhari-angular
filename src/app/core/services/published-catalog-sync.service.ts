import { Injectable, inject, signal } from '@angular/core';
import { catchError, of } from 'rxjs';
import { environment } from '@env/environment';
import {
  ProductsApiService,
  backendProductToStaging
} from '@core/services/products-api.service';
import type { StagingProduct } from '@shared/models/staging-product.model';

export interface PublishedCatalogCache {
  revision: string;
  generatedAt: string;
  cachedAt: string;
  expiresAt: string;
  products: StagingProduct[];
}

/**
 * کش ویترین صرفاً projection موقت از API سرور است؛ هیچ local staging data
 * در آن ادغام نمی‌شود و پس از TTL به‌عنوان داده زنده مصرف نمی‌شود.
 */
@Injectable({ providedIn: 'root' })
export class PublishedCatalogSyncService {
  private readonly api = inject(ProductsApiService);
  private readonly cacheKey = environment.storageKeys.publishedProducts;
  readonly version = signal(0);
  readonly revision = signal<string | null>(null);
  readonly stale = signal(false);
  readonly lastRefreshFailed = signal(false);

  getCachedProductCodes(): string[] {
    const cache = this.readCache();
    if (!cache || this.isExpired(cache)) return [];
    return cache.products.map(item => item.code || '').filter(Boolean);
  }

  refresh(): void {
    this.api
      .getPublished()
      .pipe(catchError((err) => {
        console.warn('PublishedCatalogSync: server refresh failed', err);
        this.lastRefreshFailed.set(true);
        const cached = this.readCache();
        this.stale.set(!cached || this.isExpired(cached));
        return of(null);
      }))
      .subscribe((snapshot) => {
        if (!snapshot) return;
        const now = Date.now();
        const cache: PublishedCatalogCache = {
          revision: snapshot.revision,
          generatedAt: snapshot.generatedAt,
          cachedAt: new Date(now).toISOString(),
          expiresAt: new Date(now + snapshot.ttlSeconds * 1000).toISOString(),
          products: snapshot.products.map(item => backendProductToStaging(item))
        };
        try {
          localStorage.setItem(this.cacheKey, JSON.stringify(cache));
          this.revision.set(snapshot.revision);
          this.stale.set(false);
          this.lastRefreshFailed.set(false);
          this.version.update(value => value + 1);
        } catch (err) {
          this.lastRefreshFailed.set(true);
          console.warn('PublishedCatalogSync: cache write failed', err);
        }
      });
  }

  private readCache(): PublishedCatalogCache | null {
    try {
      const parsed = JSON.parse(localStorage.getItem(this.cacheKey) || 'null') as PublishedCatalogCache | null;
      if (!parsed || !Array.isArray(parsed.products) || typeof parsed.revision !== 'string') {
        return null;
      }
      return parsed;
    } catch {
      return null;
    }
  }

  private isExpired(cache: PublishedCatalogCache): boolean {
    const expiry = Date.parse(cache.expiresAt);
    return !Number.isFinite(expiry) || expiry <= Date.now();
  }
}
