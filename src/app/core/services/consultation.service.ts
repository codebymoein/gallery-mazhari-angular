import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import {
  CONSULTATION_CONTACT_TIMES,
  ConsultationFormPayload
} from '@shared/data/consultation-options';
import { environment } from '@env/environment';
import { NotificationService } from './notification.service';

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
  cancelled: 'کنسل شد',
  scheduled: 'وقت رزرو شد'
};

export interface StoredConsultationRequest extends ConsultationFormPayload {
  id: string;
  created_at: string;
  followUpTag?: ConsultationFollowUpTag;
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
  return normalizePhoneDigits(value).length === 11;
}

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const RATE_LIMIT_MS = 60_000;

@Injectable({ providedIn: 'root' })
export class ConsultationService {
  private readonly storageKey = environment.storageKeys.consultationRequests;
  private readonly rateLimitKey = environment.storageKeys.consultationRateLimit;
  private readonly notifications = inject(NotificationService);

  messageFor(status: ConsultationSubmitStatus): string {
    return STATUS_MESSAGES[status];
  }

  getRequests(): StoredConsultationRequest[] {
    return this.readRequests();
  }

  setFollowUpTag(id: string, tag: ConsultationFollowUpTag): void {
    const requests = this.readRequests().map((r) =>
      r.id === id ? { ...r, followUpTag: tag } : r
    );
    localStorage.setItem(this.storageKey, JSON.stringify(requests));
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

        if (this.isRateLimited()) {
          subscriber.error('rate-limited');
          return;
        }

        this.persist(normalized);
        this.markRateLimited();
        subscriber.next('success');
        subscriber.complete();
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
    const nameLen = payload.last_name.length;
    const messageLen = payload.message.length;

    return (
      payload.consent &&
      nameLen >= 2 &&
      nameLen <= 80 &&
      messageLen <= 800 &&
      isValidIranMobile(payload.phone) &&
      ISO_DATE_PATTERN.test(payload.ceremony_date) &&
      payload.contact_time in CONSULTATION_CONTACT_TIMES
    );
  }

  private persist(payload: ConsultationFormPayload): void {
    const record: StoredConsultationRequest = {
      ...payload,
      id: crypto.randomUUID(),
      created_at: new Date().toISOString()
    };

    const requests = this.readRequests();
    requests.unshift(record);
    localStorage.setItem(this.storageKey, JSON.stringify(requests));

    this.notifications
      .sendConsultationAlert({
        lastName: record.last_name,
        phone: record.phone,
        weddingDate: record.ceremony_date,
        contactTime: CONSULTATION_CONTACT_TIMES[record.contact_time] ?? record.contact_time,
        productName: record.product_name,
        message: record.message,
        source: record.consultation_source
      })
      .subscribe();
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

  private isRateLimited(): boolean {
    try {
      const raw = localStorage.getItem(this.rateLimitKey);
      if (!raw) {
        return false;
      }

      const lastSubmit = Number(raw);
      return Number.isFinite(lastSubmit) && Date.now() - lastSubmit < RATE_LIMIT_MS;
    } catch {
      return false;
    }
  }

  private markRateLimited(): void {
    localStorage.setItem(this.rateLimitKey, String(Date.now()));
  }
}
