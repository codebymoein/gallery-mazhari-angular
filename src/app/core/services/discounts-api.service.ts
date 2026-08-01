import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '@env/environment';
import { AdminAuthService } from './admin-auth.service';
import { BackendProduct } from './products-api.service';

export type DiscountScope = 'category' | 'subcategory' | 'product';

export interface DiscountRule {
  id: string;
  title: string;
  subtitle?: string | null;
  scopeType: DiscountScope;
  targetKey: string;
  targetLabel: string;
  percent: number;
  badgeText?: string | null;
  priority: number;
  active: boolean;
  showOnHome: boolean;
  startsAt?: string | null;
  endsAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export type DiscountRulePayload = Omit<DiscountRule, 'id' | 'createdAt' | 'updatedAt'>;

@Injectable({ providedIn: 'root' })
export class DiscountsApiService {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AdminAuthService);
  private readonly baseUrl = `${environment.backendApiBaseUrl}/discounts`;

  getRules(): Observable<DiscountRule[]> {
    return this.http.get<DiscountRule[]>(`${this.baseUrl}/rules`, this.authOptions());
  }

  create(payload: DiscountRulePayload): Observable<DiscountRule> {
    return this.http.post<DiscountRule>(`${this.baseUrl}/rules`, payload, this.authOptions());
  }

  update(id: string, payload: DiscountRulePayload): Observable<DiscountRule> {
    return this.http.put<DiscountRule>(`${this.baseUrl}/rules/${id}`, payload, this.authOptions());
  }

  remove(id: string): Observable<{ deleted: true }> {
    return this.http.delete<{ deleted: true }>(`${this.baseUrl}/rules/${id}`, this.authOptions());
  }

  getProducts(homeOnly = false): Observable<BackendProduct[]> {
    return this.http.get<BackendProduct[]>(`${this.baseUrl}/products${homeOnly ? '?home=true' : ''}`);
  }

  private authOptions(): { headers?: HttpHeaders } {
    const token = this.auth.user()?.accessToken;
    return token ? { headers: new HttpHeaders({ Authorization: `Bearer ${token}` }) } : {};
  }
}
