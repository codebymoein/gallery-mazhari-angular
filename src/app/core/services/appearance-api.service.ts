import { isPlatformBrowser } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, PLATFORM_ID, inject, signal } from '@angular/core';
import { environment } from '@env/environment';
import { AdminAuthService } from './admin-auth.service';
import { applyCatalogOrder } from '@shared/data/catalog-categories';

export interface SiteAppearance {
  id: number;
  bridalHeroImage?: string | null;
  accessoryHeroImage?: string | null;
  categoryImages?: Record<string, string> | null;
  subcategoryImages?: Record<string, string> | null;
  categoryOrder?: string[] | null;
  subcategoryOrder?: Record<string, string[]> | null;
  consultationImage?: string | null;
  memories?: SiteMemory[] | null;
  updatedAt?: string;
}

export interface SiteMemory {
  id: string;
  name: string;
  quote: string;
  venue: string;
  image: string;
  span: 'tall' | 'wide' | 'square';
  active: boolean;
}

@Injectable({ providedIn: 'root' })
export class AppearanceApiService {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AdminAuthService);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly url = `${environment.backendApiBaseUrl}/appearance`;
  readonly appearance = signal<SiteAppearance | null>(null);
  private loadInFlight = false;

  load(): void {
    // Appearance overrides are decorative and every consumer has deterministic
    // fallback assets. Keep SSR independent from the external appearance API.
    if (!this.isBrowser) return;
    if (this.loadInFlight) return;
    this.loadInFlight = true;

    this.http.get<SiteAppearance>(this.url).subscribe({
      next: value => {
        applyCatalogOrder(value.categoryOrder ?? [], value.subcategoryOrder ?? {});
        this.appearance.set(value);
      },
      error: () => this.appearance.set({ id: 1, categoryImages: {}, subcategoryImages: {} }),
    }).add(() => {
      this.loadInFlight = false;
    });
  }

  save(payload: Partial<SiteAppearance>) {
    const token = this.auth.user()?.accessToken;
    const options = token ? { headers: new HttpHeaders({ Authorization: `Bearer ${token}` }) } : {};
    return this.http.put<SiteAppearance>(this.url, payload, options);
  }
}
