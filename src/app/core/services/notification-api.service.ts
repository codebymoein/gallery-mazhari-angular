import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '@env/environment';
import { AdminAuthService } from './admin-auth.service';

export type NotificationMode = 'auto' | 'telegram' | 'sms' | 'both' | 'disabled';
export interface NotificationSettings {
  enabled: boolean;
  mode: NotificationMode;
  telegramBotToken: string;
  telegramChatIds: string[];
  smsApiUrl: string;
  smsApiKey: string;
  smsSender: string;
  smsRecipients: string[];
  smsAuthHeader: string;
  smsAuthScheme: string;
  timeoutMs: number;
}

@Injectable({ providedIn: 'root' })
export class NotificationApiService {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AdminAuthService);
  private readonly url = `${environment.backendApiBaseUrl}/notifications`;
  settings(): Observable<NotificationSettings> { return this.http.get<NotificationSettings>(`${this.url}/settings`, this.options()); }
  save(value: NotificationSettings): Observable<NotificationSettings> { return this.http.put<NotificationSettings>(`${this.url}/settings`, value, this.options()); }
  test(channel: 'telegram' | 'sms'): Observable<{ sent: boolean }> { return this.http.post<{ sent: boolean }>(`${this.url}/test/${channel}`, {}, this.options()); }
  private options(): { headers?: HttpHeaders } {
    const token = this.auth.user()?.accessToken;
    return token ? { headers: new HttpHeaders({ Authorization: `Bearer ${token}` }) } : {};
  }
}
