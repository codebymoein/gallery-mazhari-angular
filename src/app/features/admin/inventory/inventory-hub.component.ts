import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  computed,
  inject,
  signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import {
  AdminInventoryService,
  InventorySmartFilter
} from '@core/services/admin-inventory.service';
import { StagingQueueService } from '@core/services/staging-queue.service';
import { onImgErrorUseFallback } from '@shared/utils/asset-url';
import { formatToman } from '../shared/admin-format';

@Component({
  selector: 'app-inventory-hub',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './inventory-hub.component.html',
  styleUrls: ['./inventory-hub.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class InventoryHubComponent {
  private readonly inventory = inject(AdminInventoryService);
  private readonly cdr = inject(ChangeDetectorRef);
  readonly queue = inject(StagingQueueService);

  readonly filter = signal<InventorySmartFilter>('all');
  readonly query = signal('');
  readonly selected = signal<Set<string>>(new Set());
  readonly toast = signal('');
  readonly bulkPending = signal(false);
  readonly categoryCards = this.inventory.categoryCards;

  readonly formatToman = formatToman;
  readonly onImgError = onImgErrorUseFallback;

  readonly rows = computed(() =>
    this.inventory.filtered(this.filter(), this.query())
  );

  readonly selectedCount = computed(() => this.selected().size);

  setFilter(f: InventorySmartFilter): void {
    this.filter.set(f);
  }

  onSearch(v: string): void {
    this.query.set(v);
  }

  toggle(id: string, checked: boolean): void {
    const next = new Set(this.selected());
    if (checked) next.add(id);
    else next.delete(id);
    this.selected.set(next);
  }

  toggleAll(checked: boolean): void {
    if (!checked) {
      this.selected.set(new Set());
      return;
    }
    this.selected.set(new Set(this.rows().map((r) => r.id)));
  }

  isChecked(id: string): boolean {
    return this.selected().has(id);
  }

  bulkDiscount(): void {
    const ids = [...this.selected()];
    if (!ids.length || this.bulkPending()) return;

    this.bulkPending.set(true);
    this.inventory.bulkDiscount(ids, 10).subscribe({
      next: (result) => {
        this.bulkPending.set(false);
        this.afterBulk(`تخفیف ۱۰٪ روی ${result.updated} محصول ثبت شد.`);
      },
      error: () => {
        this.bulkPending.set(false);
        this.showToast('ثبت تخفیف انجام نشد؛ تغییری به‌صورت محلی ذخیره نشد.');
      }
    });
  }

  statusLabel(status: string): string {
    const map: Record<string, string> = {
      active: 'فعال',
      draft: 'پیش‌نویس',
      out_of_stock: 'ناموجود',
      internal: 'داخلی'
    };
    return map[status] || status;
  }

  private afterBulk(message: string): void {
    this.selected.set(new Set());
    this.showToast(message);
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
