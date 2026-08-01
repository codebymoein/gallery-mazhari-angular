import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { environment } from '@env/environment';

export interface StyleProduct {
  id: string;
  code: string;
  name: string;
  category: string;
  price?: number | null;
  salePrice?: number | null;
  photos?: Array<{ url: string }>;
}

export interface SiteStyle {
  id: string;
  slug?: string | null;
  name: string;
  subtitle?: string | null;
  story?: string | null;
  style?: string | null;
  mood?: string | null;
  ceremony?: string | null;
  coverImageUrl?: string | null;
  images?: string[] | null;
  hotspots?: StyleHotspot[] | null;
  productCodes: string[];
  products: StyleProduct[];
  displayPriority: number;
}

export interface StyleHotspot {
  imageIndex: number;
  productCode: string;
  x: number;
  y: number;
  label: string;
}

@Injectable({ providedIn: 'root' })
export class StylesApiService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.backendApiBaseUrl}/platform/public/looks`;
  list() {
    return this.http.get<SiteStyle[]>(this.base, {
      params: { _: Date.now().toString() },
      headers: { 'Cache-Control': 'no-cache' }
    });
  }
  get(id: string) { return this.http.get<SiteStyle>(`${this.base}/${encodeURIComponent(id)}`); }
}
