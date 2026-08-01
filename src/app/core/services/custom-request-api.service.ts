import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@env/environment';
import { AdminAuthService } from './admin-auth.service';

export type CustomRequestType = 'veil' | 'dress';
export type CustomRequestStatus = 'new' | 'reviewing' | 'estimated' | 'contacted' | 'cancelled';

export interface CustomRequestRecord {
  id: string; type: CustomRequestType; fullName: string; phone: string; city?: string | null;
  email?: string | null; ceremonyDate?: string | null; contactTime: string; preferredContact: string;
  modelTitle: string; description: string; color?: string | null; fabric?: string | null;
  sizeOrLength?: string | null; budget?: string | null; imageUrls?: string[] | null;
  status: CustomRequestStatus; adminNote?: string | null; createdAt: string;
}

@Injectable({ providedIn: 'root' })
export class CustomRequestApiService {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AdminAuthService);
  private readonly url = `${environment.backendApiBaseUrl}/custom-requests`;

  create(data: FormData): Observable<CustomRequestRecord> { return this.http.post<CustomRequestRecord>(this.url, data); }
  list(): Observable<CustomRequestRecord[]> { return this.http.get<CustomRequestRecord[]>(this.url, this.options()); }
  update(id: string, value: Partial<Pick<CustomRequestRecord, 'status' | 'adminNote'>>): Observable<CustomRequestRecord> {
    return this.http.patch<CustomRequestRecord>(`${this.url}/${encodeURIComponent(id)}`, value, this.options());
  }
  private options(): { headers?: HttpHeaders } {
    const token = this.auth.user()?.accessToken;
    return token ? { headers: new HttpHeaders({ Authorization: `Bearer ${token}` }) } : {};
  }
}
