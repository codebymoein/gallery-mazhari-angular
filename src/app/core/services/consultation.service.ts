import { Injectable, inject } from '@angular/core';
import { Observable, map, tap } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { HttpHeaders } from '@angular/common/http';
import { AdminAuthService } from './admin-auth.service';
import { ConsultationFormPayload } from '@shared/data/consultation-options';
import { environment } from '@env/environment';
import { DreamCanvasService, DreamCanvasItem } from './dream-canvas.service';

export type ConsultationSubmitStatus =
  | 'success'
  | 'required'
  | 'invalid'
  | 'rate-limited'
  | 'save-error';

export type ConsultationFollowUpTag =
  | 'needs_followup'
  | 'contacted'
  | 'cancelled'
  | 'scheduled';

export const CONSULTATION_FOLLOW_UP_LABELS: Record<ConsultationFollowUpTag, string> = {
  needs_followup: 'نیاز به پیگیری',
  contacted: 'تماس گرفته شد',
  cancelled: 'لغو شده',
  scheduled: 'وقت رزرو شده'
};

export interface StoredConsultationRequest extends ConsultationFormPayload {
  id: string;
  created_at: string;
  followUpTag?: ConsultationFollowUpTag;
  adminNote?: string;
  /** Snapshot taken when the request is submitted; prevents mixing customers' canvases. */
  dreamItems?: Pick<DreamCanvasItem, 'productId' | 'name'>[];
}

const STATUS_MESSAGES: Record<ConsultationSubmitStatus, string> = {
  success: 'به زودی باهاتون تماس می‌گیریم',
  required: 'لطفاً نام‌خانوادگی، شماره موبایل، تاریخ مراسم و گزینه‌های ضروری را کامل کنید.',
  invalid: 'اطلاعات فرم معتبر نیست. لطفاً دوباره بررسی و ارسال کنید.',
  'rate-limited': 'درخواست قبلی شما دریافت شده است. لطفاً یک دقیقه بعد دوباره تلاش کنید.',
  'save-error': 'ثبت درخواست انجام نشد. لطفاً چند دقیقه دیگر دوباره تلاش کنید.'
};

const PERSIAN_DIGIT_MAP: Record<string, string> = {
  '۰': '0', '۱': '1', '۲': '2', '۳': '3', '۴': '4',
  '۵': '5', '۶': '6', '۷': '7', '۸': '8', '۹': '9'
};

function normalizePhoneDigits(value: string): string {
  return value
    .trim()
    .replace(/[۰-۹]/g, d => PERSIAN_DIGIT_MAP[d] ?? d)
    .replace(/\D/g, '');
}

function isValidIranMobile(value: string): boolean {
  return /^09\d{9}$/.test(normalizePhoneDigits(value));
}


@Injectable({ providedIn: 'root' })
export class ConsultationService {
  private readonly storageKey = environment.storageKeys.consultationRequests;
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AdminAuthService);
  private readonly dreamCanvas = inject(DreamCanvasService);

  messageFor(status: ConsultationSubmitStatus): string {
    return STATUS_MESSAGES[status];
  }

  getRequests(): StoredConsultationRequest[] {
    return this.readRequests();
  }

  refreshFromServer(): Observable<StoredConsultationRequest[]> {
    return this.http.get<Array<{
      id: string; lastName: string; phone: string; ceremonyDate: string; contactTime: string;
      message?: string; source: ConsultationFormPayload['consultation_source']; productName?: string;
      productId?: string; dreamItems?: Pick<DreamCanvasItem, 'productId' | 'name'>[];
      followUpTag?: ConsultationFollowUpTag; adminNote?: string; createdAt: string;
    }>>(`${environment.backendApiBaseUrl}/consultations`, this.authOptions()).pipe(
      tap(items => localStorage.setItem(this.storageKey, JSON.stringify(items.map(item => ({
        id: item.id, last_name: item.lastName, phone: item.phone, ceremony_date: item.ceremonyDate,
        contact_time: item.contactTime, message: item.message || '', consent: true,
        consultation_source: item.source, product_name: item.productName, product_id: item.productId,
        dreamItems: item.dreamItems || [], followUpTag: item.followUpTag,
        adminNote: item.adminNote || '', created_at: item.createdAt,
      }))))),
      // Read the normalized cache so all existing admin consumers keep one shape.
      map(() => this.readRequests())
    );
  }

  setFollowUpTag(id: string, tag: ConsultationFollowUpTag): void {
    const requests = this.readRequests().map((r) =>
      r.id === id ? { ...r, followUpTag: tag } : r
    );
    localStorage.setItem(this.storageKey, JSON.stringify(requests));
    this.http.patch(`${environment.backendApiBaseUrl}/consultations/${encodeURIComponent(id)}`, { followUpTag: tag }, this.authOptions()).subscribe();
  }

  setAdminNote(id: string, adminNote: string): void {
    const requests = this.readRequests().map(request =>
      request.id === id ? { ...request, adminNote: adminNote.trim() } : request
    );
    localStorage.setItem(this.storageKey, JSON.stringify(requests));
    this.http.patch(`${environment.backendApiBaseUrl}/consultations/${encodeURIComponent(id)}`, { adminNote: adminNote.trim() }, this.authOptions()).subscribe();
  }

  deleteRequests(ids: string[]): number {
    const idSet = new Set(ids);
    if (!idSet.size) return 0;
    const current = this.readRequests();
    const next = current.filter(request => !idSet.has(request.id));
    localStorage.setItem(this.storageKey, JSON.stringify(next));
    for (const id of idSet) this.http.delete(`${environment.backendApiBaseUrl}/consultations/${encodeURIComponent(id)}`, this.authOptions()).subscribe();
    return current.length - next.length;
  }

  submit(payload: ConsultationFormPayload): Observable<ConsultationSubmitStatus> {
    return new Observable(subscriber => {
      try {
        if (payload.website) {
          subscriber.next('success');
          subscriber.complete();
          return;
        }

        const normalized = this.normalize(payload);

        if (!this.isValid(normalized)) {
          subscriber.error('invalid');
          return;
        }

        this.http.post(`${environment.backendApiBaseUrl}/consultations`, {
          lastName: normalized.last_name,
          phone: normalized.phone,
          ceremonyDate: normalized.ceremony_date,
          contactTime: normalized.contact_time,
          message: normalized.message,
          consent: normalized.consent,
          source: normalized.consultation_source,
          productName: normalized.product_name,
          productId: normalized.product_id,
          website: normalized.website,
          dreamItems: this.dreamCanvas.items.map(item => ({ productId: item.productId, name: item.name })),
        }).subscribe({
          next: () => {
            this.persist(normalized);
            subscriber.next('success');
            subscriber.complete();
          },
          error: () => subscriber.error('save-error'),
        });
      } catch {
        subscriber.error('save-error');
      }
    });
  }

  private normalize(payload: ConsultationFormPayload): ConsultationFormPayload {
    return {
      last_name: payload.last_name.trim(),
      phone: normalizePhoneDigits(payload.phone),
      ceremony_date: payload.ceremony_date.trim(),
      contact_time: payload.contact_time,
      message: payload.message.trim(),
      consent: payload.consent,
      consultation_source: payload.consultation_source,
      product_name: payload.product_name?.trim() || undefined,
      product_id: payload.product_id?.trim() || undefined,
      website: payload.website
    };
  }

  private isValid(payload: ConsultationFormPayload): boolean {
    return isValidIranMobile(payload.phone);
  }

  private persist(payload: ConsultationFormPayload): void {
    const record: StoredConsultationRequest = {
      ...payload,
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
      dreamItems: this.dreamCanvas.items.map(item => ({
        productId: item.productId,
        name: item.name
      }))
    };

    const requests = this.readRequests();
    requests.unshift(record);
    localStorage.setItem(this.storageKey, JSON.stringify(requests));

  }

  private readRequests(): StoredConsultationRequest[] {
    try {
      const raw = localStorage.getItem(this.storageKey);
      if (!raw) {
        return [];
      }

      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }


  private authOptions(): { headers?: HttpHeaders } {
    const token = this.auth.user()?.accessToken;
    return token ? { headers: new HttpHeaders({ Authorization: `Bearer ${token}` }) } : {};
  }
}
