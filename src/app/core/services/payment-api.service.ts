import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { environment } from '@env/environment';
import { Observable } from 'rxjs';
import { AdminAuthService } from './admin-auth.service';

export type PaymentProvider = 'disabled' | 'zarinpal' | 'custom';

export interface PaymentSettings {
  id?: number;
  enabled: boolean;
  provider: PaymentProvider;
  displayName: string;
  merchantId?: string;
  customRequestUrl?: string;
  customVerifyUrl?: string;
  customPaymentUrlTemplate?: string;
  customApiKey?: string;
  sandbox: boolean;
  currency?: 'IRR';
}

export interface CreatePaymentResponse {
  transactionId: string;
  orderNumber: string;
  orderToken: string;
  amount: number;
  currency: 'IRR';
  redirectUrl: string;
}

@Injectable({ providedIn: 'root' })
export class PaymentApiService {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AdminAuthService);
  private readonly url = `${environment.backendApiBaseUrl}/payments`;

  publicSettings(): Observable<PaymentSettings> {
    return this.http.get<PaymentSettings>(`${this.url}/settings/public`);
  }

  adminSettings(): Observable<PaymentSettings> {
    return this.http.get<PaymentSettings>(`${this.url}/settings`, this.authOptions());
  }

  saveSettings(value: PaymentSettings): Observable<PaymentSettings> {
    return this.http.put<PaymentSettings>(`${this.url}/settings`, value, this.authOptions());
  }

  createPayment(payload: {
    items: Array<{
      code: string;
      quantity: number;
      customization?: 'engraving' | 'veil-print';
    }>;
    shippingMethod: 'standard' | 'express' | 'pickup';
    customer: Record<string, string>;
    note?: string;
  }): Observable<CreatePaymentResponse> {
    return this.http.post<CreatePaymentResponse>(`${this.url}/create`, payload);
  }

  private authOptions(): { headers?: HttpHeaders } {
    const token = this.auth.user()?.accessToken;
    return token
      ? { headers: new HttpHeaders({ Authorization: `Bearer ${token}` }) }
      : {};
  }
}
