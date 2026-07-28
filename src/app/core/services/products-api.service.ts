import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
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
  isNewImport: boolean;
  status: StagingStatus;
  photos: Array<{ url: string; fileName: string; addedAt: string }>;
  importedAt?: string | null;
  processedAt?: string | null;
  publishedAt?: string | null;
  processedBy?: string | null;
  publishedBy?: string | null;
  notes?: string | null;
}

export interface ImportResponse {
  added: number;
  updated: number;
  removed: number;
  queue: BackendProduct[];
}

/** تبدیل رکورد بک‌اند به مدل صف انتشار فرانت */
export function backendProductToStaging(p: BackendProduct): StagingProduct {
  return {
    id: p.id,
    code: p.code,
    name: p.name,
    category: p.category,
    parentCategory: p.parentCategory,
    parentCategorySlug: p.parentCategorySlug,
    categorySlug: p.categorySlug,
    stock: p.stock,
    isNewImport: p.isNewImport,
    status: p.status,
    photos: p.photos ?? [],
    photoUrl: p.photos?.[0]?.url,
    photoFileName: p.photos?.[0]?.fileName,
    importedAt: p.importedAt ?? new Date().toISOString(),
    processedAt: p.processedAt ?? undefined,
    publishedAt: p.publishedAt ?? undefined,
    processedBy: p.processedBy ?? undefined,
    publishedBy: p.publishedBy ?? undefined,
    notes: p.notes ?? undefined
  };
}

@Injectable({ providedIn: 'root' })
export class ProductsApiService {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AdminAuthService);
  private readonly baseUrl = `${environment.backendApiBaseUrl}/products`;

  getPublished(): Observable<BackendProduct[]> {
    return this.http.get<BackendProduct[]>(`${this.baseUrl}/published`);
  }

  getQueue(): Observable<BackendProduct[]> {
    return this.http.get<BackendProduct[]>(this.baseUrl, this.authOptions());
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
      isNewImport?: boolean;
    }>;
    removedOutOfStock: string[];
    fileName?: string;
  }): Observable<ImportResponse> {
    return this.http.post<ImportResponse>(
      `${this.baseUrl}/import`,
      payload,
      this.authOptions()
    );
  }

  attachPhotos(
    id: string,
    photos: Array<{ url: string; fileName: string }>,
    processedBy: string
  ): Observable<BackendProduct> {
    return this.http.post<BackendProduct>(
      `${this.baseUrl}/${id}/photos`,
      { photos, processedBy },
      this.authOptions()
    );
  }

  removePhoto(id: string, index: number): Observable<BackendProduct> {
    return this.http.delete<BackendProduct>(
      `${this.baseUrl}/${id}/photos/${index}`,
      this.authOptions()
    );
  }

  publish(id: string, publishedBy: string): Observable<BackendProduct> {
    return this.http.post<BackendProduct>(
      `${this.baseUrl}/${id}/publish`,
      { publishedBy },
      this.authOptions()
    );
  }

  overrideStatus(
    id: string,
    status: StagingStatus,
    actor: string
  ): Observable<BackendProduct> {
    return this.http.patch<BackendProduct>(
      `${this.baseUrl}/${id}/status`,
      { status, actor },
      this.authOptions()
    );
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
