import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  HostListener,
  OnInit,
  inject
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BookingService } from '@core/services/booking.service';

const WISHLIST_KEY = 'gm-wishlist-ids';

@Component({
  selector: 'app-floating-actions',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './floating-actions.component.html',
  styleUrls: ['./floating-actions.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FloatingActionsComponent implements OnInit {
  private readonly booking = inject(BookingService);
  private readonly cdr = inject(ChangeDetectorRef);

  /** WhatsApp / Telegram deep links (placeholders until real numbers are set). */
  readonly whatsappHref =
    'https://wa.me/989352181200?text=' +
    encodeURIComponent('سلام، از گالری مظهری پیام می‌دهم.');
  readonly telegramHref = 'https://t.me/';

  callbackOpen = false;
  phone = '';
  submitted = false;
  submitError = '';

  /** Saved product / look ids for wishlist & compare. */
  wishlistIds: string[] = [];

  ngOnInit(): void {
    this.wishlistIds = this.readWishlist();
  }

  get wishlistCount(): number {
    return this.wishlistIds.length;
  }

  get hasWishlist(): boolean {
    return this.wishlistIds.length > 0;
  }

  openCallback(): void {
    this.callbackOpen = true;
    this.submitted = false;
    this.submitError = '';
    this.cdr.markForCheck();
  }

  closeCallback(): void {
    this.callbackOpen = false;
    this.cdr.markForCheck();
  }

  toggleCallback(): void {
    if (this.callbackOpen) {
      this.closeCallback();
    } else {
      this.openCallback();
    }
  }

  submitCallback(): void {
    const digits = this.normalizePhone(this.phone);
    if (digits.length < 10) {
      this.submitError = 'لطفاً شماره معتبر وارد کنید.';
      this.cdr.markForCheck();
      return;
    }

    this.submitError = '';
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    this.booking.simulateSmsReminder(digits, tomorrow);
    this.submitted = true;
    this.phone = '';
    this.cdr.markForCheck();

    window.setTimeout(() => {
      this.closeCallback();
      this.submitted = false;
      this.cdr.markForCheck();
    }, 1800);
  }

  /** Toggle a demo wishlist item (generic floating tracker). */
  toggleWishlist(): void {
    const demoId = 'floating-demo';
    const idx = this.wishlistIds.indexOf(demoId);
    if (idx >= 0) {
      this.wishlistIds = this.wishlistIds.filter(id => id !== demoId);
    } else {
      this.wishlistIds = [...this.wishlistIds, demoId];
    }
    this.persistWishlist();
    this.cdr.markForCheck();
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.callbackOpen) {
      this.closeCallback();
    }
  }

  private normalizePhone(value: string): string {
    const map: Record<string, string> = {
      '۰': '0', '۱': '1', '۲': '2', '۳': '3', '۴': '4',
      '۵': '5', '۶': '6', '۷': '7', '۸': '8', '۹': '9'
    };
    return value
      .trim()
      .replace(/[۰-۹]/g, d => map[d] ?? d)
      .replace(/\D/g, '');
  }

  private readWishlist(): string[] {
    try {
      const raw = localStorage.getItem(WISHLIST_KEY);
      if (!raw) {
        return [];
      }
      const parsed = JSON.parse(raw) as unknown;
      return Array.isArray(parsed) ? parsed.map(String) : [];
    } catch {
      return [];
    }
  }

  private persistWishlist(): void {
    try {
      localStorage.setItem(WISHLIST_KEY, JSON.stringify(this.wishlistIds));
    } catch {
      // Ignore quota / private mode errors.
    }
  }
}
