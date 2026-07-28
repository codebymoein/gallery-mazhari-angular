import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  inject,
  signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminMarketingService } from '@core/services/admin-marketing.service';
import { formatFaDate, formatToman } from '../shared/admin-format';

@Component({
  selector: 'app-marketing-hub',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './marketing-hub.component.html',
  styleUrls: ['./marketing-hub.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MarketingHubComponent {
  private readonly marketing = inject(AdminMarketingService);
  private readonly cdr = inject(ChangeDetectorRef);

  readonly promos = this.marketing.promos;
  readonly carts = this.marketing.abandonedCarts;
  readonly toast = signal('');

  readonly formatToman = formatToman;
  readonly formatFaDate = formatFaDate;

  code = '';
  type: 'percent' | 'fixed' = 'percent';
  value = 10;
  usageLimit = 50;
  startsAt = this.toInputDate(new Date());
  endsAt = this.toInputDate(new Date(Date.now() + 86400000 * 30));
  note = '';

  create(): void {
    if (!this.code.trim() || this.value <= 0) {
      this.showToast('کد و مقدار تخفیف را کامل وارد کنید.');
      return;
    }
    this.marketing.createPromo({
      code: this.code.trim().toUpperCase(),
      type: this.type,
      value: this.type === 'percent' ? this.value : this.value * 1_000_000,
      startsAt: new Date(this.startsAt).toISOString(),
      endsAt: new Date(this.endsAt).toISOString(),
      usageLimit: this.usageLimit,
      note: this.note.trim() || undefined
    });
    this.code = '';
    this.note = '';
    this.showToast('کد تخفیف ساخته شد.');
  }

  toggle(id: string): void {
    this.marketing.togglePromo(id);
  }

  remind(id: string): void {
    const result = this.marketing.sendCartReminder(id);
    this.showToast(result.message);
  }

  valueLabel(type: string, value: number): string {
    return type === 'percent'
      ? `${new Intl.NumberFormat('fa-IR').format(value)}٪`
      : formatToman(value);
  }

  private toInputDate(d: Date): string {
    return d.toISOString().slice(0, 10);
  }

  private showToast(message: string): void {
    this.toast.set(message);
    this.cdr.markForCheck();
    window.setTimeout(() => {
      this.toast.set('');
      this.cdr.markForCheck();
    }, 3500);
  }
}
