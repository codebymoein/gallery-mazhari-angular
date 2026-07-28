import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { environment } from '@env/environment';

export type TimelinePhase = 'planning' | 'soon' | 'urgent' | 'past' | 'today' | null;

export interface TimelineState {
  date: string | null;
  daysRemaining: number | null;
  phase: TimelinePhase;
  title: string;
  message: string;
  personalized: boolean;
}

interface StoredTimeline {
  date: string;
  consentedAt: string;
  expiresAt: number;
}

interface StoredPrompt {
  dismissUntil: number;
}

@Injectable({ providedIn: 'root' })
export class WeddingTimelineService {
  private readonly storageKey = environment.storageKeys.weddingTimeline;
  private readonly promptKey = environment.storageKeys.weddingTimelinePrompt;
  private readonly retentionDays = 365;
  private readonly postEventDays = 30;
  private readonly dismissDays = 30;

  private readonly openSubject = new BehaviorSubject<boolean>(false);
  private readonly stateSubject = new BehaviorSubject<TimelineState>(this.emptyState());
  private readonly statusSubject = new BehaviorSubject<string>('');

  readonly isOpen$: Observable<boolean> = this.openSubject.asObservable();
  readonly state$: Observable<TimelineState> = this.stateSubject.asObservable();
  readonly status$: Observable<string> = this.statusSubject.asObservable();

  get latestStatus(): string {
    return this.statusSubject.value;
  }

  constructor() {
    this.hydrate();
  }

  get state(): TimelineState {
    return this.stateSubject.value;
  }

  isOpen(): boolean {
    return this.openSubject.value;
  }

  open(): void {
    this.openSubject.next(true);
  }

  close(): void {
    this.openSubject.next(false);
  }

  dismissAutoPrompt(): void {
    const until = Date.now() + this.dismissDays * 24 * 60 * 60 * 1000;
    try {
      const payload: StoredPrompt = { dismissUntil: until };
      localStorage.setItem(this.promptKey, JSON.stringify(payload));
    } catch {
      // Ignore storage failures for dismiss preference.
    }
    this.close();
  }

  canAutoPrompt(): boolean {
    if (this.state.personalized) {
      return false;
    }

    try {
      const raw = localStorage.getItem(this.promptKey);
      if (!raw) {
        return true;
      }
      const parsed = JSON.parse(raw) as StoredPrompt;
      return !(parsed?.dismissUntil && parsed.dismissUntil > Date.now());
    } catch {
      return true;
    }
  }

  save(date: string, consented: boolean): boolean {
    if (!consented) {
      this.statusSubject.next('برای ذخیره، رضایت ذخیره روی مرورگر لازم است.');
      return false;
    }

    if (!this.isValidDate(date)) {
      this.statusSubject.next('لطفاً یک تاریخ معتبر در بازه مشخص‌شده انتخاب کنید.');
      return false;
    }

    const consentedAt = new Date().toISOString();
    const ceremonyMs = this.parseDate(date).getTime();
    const retentionMs = Date.now() + this.retentionDays * 24 * 60 * 60 * 1000;
    const postEventMs = ceremonyMs + this.postEventDays * 24 * 60 * 60 * 1000;
    const expiresAt = Math.min(retentionMs, postEventMs);

    try {
      const payload: StoredTimeline = { date, consentedAt, expiresAt };
      localStorage.setItem(this.storageKey, JSON.stringify(payload));
      this.stateSubject.next(this.buildState(date));
      this.statusSubject.next('تاریخ مراسم روی همین مرورگر ذخیره شد.');
      return true;
    } catch {
      this.stateSubject.next(this.buildState(date));
      this.statusSubject.next(
        'ذخیره دائمی در این مرورگر ممکن نیست؛ نتیجه فقط تا بستن صفحه نمایش داده می‌شود.'
      );
      return true;
    }
  }

  remove(): void {
    try {
      localStorage.removeItem(this.storageKey);
    } catch {
      // Ignore.
    }
    this.stateSubject.next(this.emptyState());
    this.statusSubject.next('تاریخ ذخیره‌شده از این مرورگر حذف شد.');
  }

  minDate(): string {
    return this.formatIso(new Date());
  }

  maxDate(): string {
    const max = new Date();
    max.setFullYear(max.getFullYear() + 3);
    return this.formatIso(max);
  }

  triggerLabel(): string {
    const state = this.state;
    if (!state.personalized || state.daysRemaining === null) {
      return 'برنامه‌ریزی مراسم';
    }
    if (state.phase === 'today') {
      return 'امروز روز مراسم شماست';
    }
    if (state.phase === 'past') {
      return 'مراسم شما برگزار شده است';
    }
    return `تا مراسم: ${state.daysRemaining.toLocaleString('fa-IR')} روز`;
  }

  private hydrate(): void {
    try {
      const raw = localStorage.getItem(this.storageKey);
      if (!raw) {
        return;
      }

      const parsed = JSON.parse(raw) as StoredTimeline;
      if (!parsed?.date || !this.isValidDate(parsed.date)) {
        localStorage.removeItem(this.storageKey);
        return;
      }

      if (parsed.expiresAt && parsed.expiresAt < Date.now()) {
        localStorage.removeItem(this.storageKey);
        return;
      }

      this.stateSubject.next(this.buildState(parsed.date));
    } catch {
      // Keep empty state.
    }
  }

  private buildState(date: string): TimelineState {
    const today = this.startOfDay(new Date());
    const ceremony = this.startOfDay(this.parseDate(date));
    const diffMs = ceremony.getTime() - today.getTime();
    const daysRemaining = Math.round(diffMs / (24 * 60 * 60 * 1000));

    let phase: TimelinePhase;
    let title: string;
    let message: string;

    if (daysRemaining > 90) {
      phase = 'planning';
      title = `تا مراسم: ${daysRemaining.toLocaleString('fa-IR')} روز`;
      message =
        'فرصت خوبی برای ساختن یک استایل کامل و هماهنگ دارید؛ می‌توانید انتخاب‌ها را با آرامش مقایسه کنید.';
    } else if (daysRemaining > 30) {
      phase = 'soon';
      title = `تا مراسم: ${daysRemaining.toLocaleString('fa-IR')} روز`;
      message =
        'در بازه طلایی انتخاب و هماهنگی هستید؛ پیشنهاد می‌کنیم لباس و اکسسوری‌های اصلی را اولویت‌بندی کنید.';
    } else if (daysRemaining > 0) {
      phase = 'urgent';
      title = `تا مراسم: ${daysRemaining.toLocaleString('fa-IR')} روز`;
      message =
        'زمان مراسم نزدیک است؛ برای بررسی موجودی و هماهنگی سریع‌تر، درخواست مشاوره را در اولویت بگذارید.';
    } else if (daysRemaining === 0) {
      phase = 'today';
      title = 'امروز روز مراسم شماست';
      message =
        'اگر برای تکمیل خرید، نگهداری لباس یا برنامه‌ریزی مراسم دیگری نیاز به راهنمایی دارید، تاریخ را به‌روز کنید.';
    } else {
      phase = 'past';
      title = 'مراسم شما برگزار شده است';
      message =
        'اگر برای تکمیل خرید، نگهداری لباس یا برنامه‌ریزی مراسم دیگری نیاز به راهنمایی دارید، تاریخ را به‌روز کنید.';
    }

    return {
      date,
      daysRemaining,
      phase,
      title,
      message,
      personalized: true
    };
  }

  private emptyState(): TimelineState {
    return {
      date: null,
      daysRemaining: null,
      phase: null,
      title: '',
      message: '',
      personalized: false
    };
  }

  private isValidDate(value: string): boolean {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      return false;
    }
    const date = this.parseDate(value);
    if (Number.isNaN(date.getTime())) {
      return false;
    }
    const min = this.startOfDay(new Date());
    const max = this.startOfDay(this.parseDate(this.maxDate()));
    const current = this.startOfDay(date);
    return current.getTime() >= min.getTime() && current.getTime() <= max.getTime();
  }

  private parseDate(value: string): Date {
    const [year, month, day] = value.split('-').map(Number);
    return new Date(year, month - 1, day);
  }

  private startOfDay(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
  }

  private formatIso(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
}
