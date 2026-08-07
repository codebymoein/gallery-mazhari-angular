import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, map, tap } from 'rxjs';
import { BridalPreferenceService } from './bridal-preference.service';
import { environment } from '@env/environment';
import { AdminAuthService } from '@core/services/admin-auth.service';
import {
  StagingProduct,
  StagingStatus
} from '@shared/models/staging-product.model';

/** شکل رکورد محصول در پاسخ بک‌اند NestJS */
export interface BackendProduct {
  id: string;
  code: string;
  name: string;
  category: string;
  parentCategory: string;
  parentCategorySlug: string;
  categorySlug: string;
  stock: number;
  price?: number | null;
  originalPrice?: number | null;
  salePrice?: number | null;
  discountPercent?: number | null;
  discountTitle?: string | null;
  discountBadge?: string | null;
  discountEndsAt?: string | null;
  isNewImport: boolean;
  status: StagingStatus;
  trashedFromStatus?: StagingStatus | null;
  photos: Array<{ url: string; fileName: string; addedAt: string }>;
  importedAt?: string | null;
  processedAt?: string | null;
  publishedAt?: string | null;
  processedBy?: string | null;
  publishedBy?: string | null;
  notes?: string | null;
  size?: string | null;
  color?: string | null;
  material?: string | null;
  description?: string | null;
  enrichment?: Record<string, unknown> | null;
  updatedAt: string;
  variations?: Array<{
    id: string;
    sku: string;
    barcode: string;
    size?: string | null;
    color?: string | null;
    material?: string | null;
    price?: number | null;
    stock: number;
    available: boolean;
  }>;
}

export interface PublishedCatalogSnapshot {
  revision: string;
  generatedAt: string;
  ttlSeconds: number;
  products: BackendProduct[];
}

export interface ImportResponse {
  added: number;
  updated: number;
  removed: number;
  queue: BackendProduct[];
}

/** تبدیل رکورد بک‌اند به مدل صف انتشار فرانت */
export function backendProductToStaging(p: BackendProduct): StagingProduct {
  const enrichment = p.enrichment ?? {};
  return {
    id: p.id,
    code: p.code,
    name: p.name,
    category: p.category,
    parentCategory: p.parentCategory,
    parentCategorySlug: p.parentCategorySlug,
    categorySlug: p.categorySlug,
    stock: p.stock,
    price: p.price ?? undefined,
    originalPrice: p.originalPrice ?? undefined,
    salePrice: p.salePrice ?? undefined,
    discountPercent: p.discountPercent ?? undefined,
    discountTitle: p.discountTitle ?? undefined,
    discountBadge: p.discountBadge ?? undefined,
    size: p.size ?? undefined,
    color: p.color ?? undefined,
    material: p.material ?? undefined,
    description: p.description ?? undefined,
    additionalDescription:
      typeof enrichment['additionalDescription'] === 'string'
        ? enrichment['additionalDescription']
        : undefined,
    heelHeight:
      typeof enrichment['heelHeight'] === 'string'
        ? enrichment['heelHeight']
        : undefined,
    platformHeight:
      typeof enrichment['platformHeight'] === 'string'
        ? enrichment['platformHeight']
        : undefined,
    variantKey:
      typeof enrichment['variantKey'] === 'string'
        ? enrichment['variantKey']
        : undefined,
    variations: (p.variations ?? []).map(variation => ({
      id: variation.id,
      sku: variation.sku,
      barcode: variation.barcode,
      size: variation.size ?? undefined,
      color: variation.color ?? undefined,
      material: variation.material ?? undefined,
      price: variation.price ?? undefined,
      stock: variation.stock,
      available: variation.available && variation.stock > 0
    })),
    hiddenTags: Array.isArray(enrichment['hiddenTags'])
      ? enrichment['hiddenTags'].filter((tag): tag is string => typeof tag === 'string')
      : [],
    modelSelectionEnabled: enrichment['modelSelectionEnabled'] === true,
    isNewImport: p.isNewImport,
    status: p.status,
    trashedFromStatus: p.trashedFromStatus ?? undefined,
    photos: p.photos ?? [],
    photoUrl: p.photos?.[0]?.url,
    photoFileName: p.photos?.[0]?.fileName,
    importedAt: p.importedAt ?? new Date().toISOString(),
    processedAt: p.processedAt ?? undefined,
    publishedAt: p.publishedAt ?? undefined,
    processedBy: p.processedBy ?? undefined,
    publishedBy: p.publishedBy ?? undefined,
    updatedAt: p.updatedAt,
    notes: p.notes ?? undefined
  };
}

@Injectable({ providedIn: 'root' })
export class ProductsApiService {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AdminAuthService);
  private readonly preferences = inject(BridalPreferenceService);
  private readonly baseUrl = `${environment.backendApiBaseUrl}/products`;
  private readonly catalogVersions = new Map<string, string>();

  getPublished(): Observable<PublishedCatalogSnapshot> {
    return this.http
      .get<PublishedCatalogSnapshot>(`${this.baseUrl}/published`)
      .pipe(map(snapshot => ({ ...snapshot, products: this.rankPublished(snapshot.products) })));
  }

  getQueue(): Observable<BackendProduct[]> {
    return this.http.get<BackendProduct[]>(this.baseUrl, this.authOptions()).pipe(
      tap(items => this.rememberVersions(items))
    );
  }

  applyImport(payload: {
    products: Array<{
      code: string;
      name: string;
      category: string;
      parentCategory?: string;
      parentCategorySlug?: string;
      categorySlug?: string;
      stock: number;
      status?: StagingStatus;
      price?: number;
      isNewImport?: boolean;
      size?: string;
      material?: string;
      heelHeight?: string;
      platformHeight?: string;
      variantKey?: string;
      variations?: Array<{
        sku: string;
        barcode: string;
        size?: string;
        color?: string;
        material?: string;
        price?: number;
        stock: number;
        available: boolean;
      }>;
    }>;
    removedOutOfStock: string[];
    fileName?: string;
  }): Observable<ImportResponse> {
    return this.http.post<ImportResponse>(
      `${this.baseUrl}/import`,
      payload,
      this.authOptions()
    ).pipe(tap(result => this.rememberVersions(result.queue)));
  }

  attachPhotos(
    id: string,
    photos: Array<{ url: string; fileName: string }>,
    processedBy: string
  ): Observable<BackendProduct> {
    return this.trackVersion(this.http.post<BackendProduct>(
      `${this.baseUrl}/${id}/photos`,
      { photos, processedBy },
      this.authOptions()
    ));
  }

  removePhoto(id: string, index: number): Observable<BackendProduct> {
    return this.trackVersion(this.http.delete<BackendProduct>(
      `${this.baseUrl}/${id}/photos/${index}`,
      this.authOptions()
    ));
  }

  setPrimaryPhoto(id: string, index: number): Observable<BackendProduct> {
    return this.trackVersion(this.http.patch<BackendProduct>(
      `${this.baseUrl}/${id}/photos/${index}/primary`,
      {},
      this.authOptions()
    ));
  }

  publish(id: string, publishedBy: string): Observable<BackendProduct> {
    return this.trackVersion(this.http.post<BackendProduct>(
      `${this.baseUrl}/${id}/publish`,
      { publishedBy },
      this.authOptions()
    ));
  }

  unpublish(id: string, actor: string): Observable<BackendProduct> {
    return this.trackVersion(this.http.post<BackendProduct>(
      `${this.baseUrl}/${id}/unpublish`,
      { actor },
      this.authOptions()
    ));
  }

  overrideStatus(
    id: string,
    status: StagingStatus,
    actor: string
  ): Observable<BackendProduct> {
    return this.trackVersion(this.http.patch<BackendProduct>(
      `${this.baseUrl}/${id}/status`,
      { status, actor },
      this.authOptions()
    ));
  }

  restoreProducts(products: StagingProduct[]): Observable<{ restored: number; queue: BackendProduct[] }> {
    return this.http.post<{ restored: number; queue: BackendProduct[] }>(
      `${this.baseUrl}/restore`,
      { products },
      this.authOptions()
    ).pipe(tap(result => this.rememberVersions(result.queue)));
  }

  updateCatalog(
    id: string,
    payload: {
      category: string;
      categorySlug: string;
      parentCategory: string;
      parentCategorySlug: string;
      collection?: string;
      hiddenTags?: string[];
      modelSelectionEnabled?: boolean;
    }
  ): Observable<BackendProduct> {
    const expectedUpdatedAt = this.catalogVersions.get(id);
    if (!expectedUpdatedAt) {
      throw new Error('catalog_version_missing_refresh_required');
    }
    return this.trackVersion(this.http.patch<BackendProduct>(
      `${this.baseUrl}/${id}/catalog`,
      { ...payload, expectedUpdatedAt },
      this.authOptions()
    ));
  }

  private rankPublished(items: BackendProduct[]): BackendProduct[] {
    const wanted = new Set(this.preferences.tags());
    if (!wanted.size) return items;
    return items
      .map((item, index) => ({
        item,
        index,
        score: Array.isArray(item.enrichment?.['hiddenTags'])
          ? (item.enrichment!['hiddenTags'] as unknown[])
              .filter(tag => wanted.has(String(tag))).length
          : 0
      }))
      .sort((a, b) => b.score - a.score || a.index - b.index)
      .map(row => row.item);
  }

  private rememberVersions(items: BackendProduct[]): void {
    for (const item of items) {
      if (item.updatedAt) this.catalogVersions.set(item.id, item.updatedAt);
    }
  }

  private trackVersion(source: Observable<BackendProduct>): Observable<BackendProduct> {
    return source.pipe(tap(item => {
      if (item.updatedAt) this.catalogVersions.set(item.id, item.updatedAt);
    }));
  }

  private authOptions(): { headers?: HttpHeaders } {
    const token = this.auth.user()?.accessToken;
    if (!token) {
      return {};
    }
    return {
      headers: new HttpHeaders({ Authorization: `Bearer ${token}` })
    };
  }
}
