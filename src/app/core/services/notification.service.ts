import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, catchError, map, timeout } from 'rxjs';
import { environment } from '@env/environment';
import { DreamCanvasService } from './dream-canvas.service';

export type NotificationChannel = 'telegram' | 'sms' | 'fallback-queue';

export interface NotificationPayload {
  type: 'booking' | 'consultation' | 'callback' | 'order' | 'admin-alert';
  title: string;
  message: string;
  customerName?: string;
  phone?: string;
  weddingDate?: string;
  requestedModel?: string;
  dreamBoardSummary?: string;
  meta?: Record<string, string | number | boolean | null | undefined>;
}

export interface NotificationResult {
  ok: boolean;
  channel: NotificationChannel;
  queued: boolean;
  detail: string;
}

interface QueuedNotification extends NotificationPayload {
  id: string;
  createdAt: string;
  attempts: number;
}

/**
 * Offline-first notification layer for Telegram Bot / SMS gateway.
 * Designed as a fallback when international internet is restricted:
 * 1) Try Telegram bot API (if configured)
 * 2) Try SMS gateway endpoint (if configured)
 * 3) Persist to local queue for later sync
 */
@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly http = inject(HttpClient);
  private readonly dreamCanvas = inject(DreamCanvasService);
  private readonly queueKey = 'mazhari_notification_queue_v1';

  send(payload: NotificationPayload): Observable<NotificationResult> {
    const enriched = this.enrich(payload);

    if (environment.notifications?.telegramBotToken && environment.notifications?.telegramChatId) {
      return this.sendTelegram(enriched).pipe(
        catchError(() => this.trySmsOrQueue(enriched))
      );
    }

    return this.trySmsOrQueue(enriched);
  }

  /** Consultation requests with full customer + dream board context. */
  sendConsultationAlert(data: {
    lastName: string;
    phone: string;
    weddingDate: string;
    contactTime: string;
    productName?: string;
    message?: string;
    source?: string;
  }): Observable<NotificationResult> {
    const dreamItems = this.dreamCanvas.items;
    const dreamBoardSummary = dreamItems.length
      ? dreamItems.slice(0, 12).map(i => i.name).join(' · ')
      : 'بدون آیتم در بوم رویایی';

    return this.send({
      type: 'consultation',
      title: 'درخواست مشاوره جدید',
      message: [
        `نام: ${data.lastName}`,
        `موبایل: ${data.phone}`,
        `تاریخ مراسم: ${data.weddingDate}`,
        `زمان تماس: ${data.contactTime}`,
        data.productName ? `مدل درخواستی: ${data.productName}` : null,
        data.message ? `توضیحات: ${data.message}` : null,
        data.source ? `منبع: ${data.source}` : null,
        `بوم رویایی: ${dreamBoardSummary}`
      ].filter(Boolean).join('\n'),
      customerName: data.lastName,
      phone: data.phone,
      weddingDate: data.weddingDate,
      requestedModel: data.productName,
      dreamBoardSummary
    });
  }

  sendBookingTime(data: {
    name: string;
    phone: string;
    bookingTime: string;
    note?: string;
  }): Observable<NotificationResult> {
    return this.send({
      type: 'booking',
      title: 'رزرو وقت',
      message: [
        `نام: ${data.name}`,
        `موبایل: ${data.phone}`,
        `زمان رزرو: ${data.bookingTime}`,
        data.note ? `یادداشت: ${data.note}` : null
      ].filter(Boolean).join('\n'),
      customerName: data.name,
      phone: data.phone,
      meta: { bookingTime: data.bookingTime }
    });
  }

  /** Flush queued notifications when connectivity returns. */
  flushQueue(): Observable<{ sent: number; remaining: number }> {
    const queue = this.readQueue();
    if (!queue.length) {
      return of({ sent: 0, remaining: 0 });
    }

    let sent = 0;
    const remaining: QueuedNotification[] = [];

    // Best-effort sequential attempts without blocking UI forever.
    for (const item of queue) {
      // Synchronous local retry bookkeeping; actual network is fire-and-forget.
      item.attempts += 1;
      remaining.push(item);
    }

    this.writeQueue(remaining.filter(i => i.attempts < 5));
    // Re-attempt first item via send pipeline
    const first = queue[0];
    if (first) {
      this.send(first).subscribe(result => {
        if (result.ok && !result.queued) {
          sent = 1;
          this.writeQueue(this.readQueue().filter(q => q.id !== first.id));
        }
      });
    }

    return of({ sent, remaining: this.readQueue().length });
  }

  getQueuedCount(): number {
    return this.readQueue().length;
  }

  private trySmsOrQueue(payload: NotificationPayload): Observable<NotificationResult> {
    if (environment.notifications?.smsGatewayUrl) {
      return this.sendSms(payload).pipe(
        catchError(() => of(this.enqueue(payload)))
      );
    }
    return of(this.enqueue(payload));
  }

  private sendTelegram(payload: NotificationPayload): Observable<NotificationResult> {
    const token = environment.notifications!.telegramBotToken!;
    const chatId = environment.notifications!.telegramChatId!;
    const url = `https://api.telegram.org/bot${token}/sendMessage`;
    const text = `✦ ${payload.title}\n\n${payload.message}`;

    return this.http
      .post(url, { chat_id: chatId, text, disable_web_page_preview: true })
      .pipe(
        timeout(8000),
        map(() => ({
          ok: true,
          channel: 'telegram' as const,
          queued: false,
          detail: 'ارسال از طریق تلگرام انجام شد.'
        }))
      );
  }

  private sendSms(payload: NotificationPayload): Observable<NotificationResult> {
    const url = environment.notifications!.smsGatewayUrl!;
    return this.http
      .post(url, {
        to: environment.notifications?.smsAdminNumber || payload.phone,
        text: `${payload.title}\n${payload.message}`
      })
      .pipe(
        timeout(8000),
        map(() => ({
          ok: true,
          channel: 'sms' as const,
          queued: false,
          detail: 'ارسال از طریق پیامک انجام شد.'
        }))
      );
  }

  private enqueue(payload: NotificationPayload): NotificationResult {
    const queue = this.readQueue();
    queue.unshift({
      ...payload,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      attempts: 0
    });
    this.writeQueue(queue.slice(0, 100));
    return {
      ok: true,
      channel: 'fallback-queue',
      queued: true,
      detail: 'اینترنت محدود بود؛ پیام در صف آفلاین ذخیره شد.'
    };
  }

  private enrich(payload: NotificationPayload): NotificationPayload {
    if (payload.dreamBoardSummary) {
      return payload;
    }
    const names = this.dreamCanvas.items.slice(0, 8).map(i => i.name);
    return {
      ...payload,
      dreamBoardSummary: names.length ? names.join(' · ') : payload.dreamBoardSummary
    };
  }

  private readQueue(): QueuedNotification[] {
    try {
      const raw = localStorage.getItem(this.queueKey);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  private writeQueue(items: QueuedNotification[]): void {
    try {
      localStorage.setItem(this.queueKey, JSON.stringify(items));
    } catch {
      // Ignore quota errors.
    }
  }
}
