import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  computed,
  inject,
  signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AdminAuthService } from '@core/services/admin-auth.service';
import { StagingQueueService } from '@core/services/staging-queue.service';
import {
  STAGING_STATUS_LABELS,
  StagingProduct,
  StagingStatus
} from '@shared/models/staging-product.model';

@Component({
  selector: 'app-manager-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './manager-dashboard.component.html',
  styleUrls: ['./manager-dashboard.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ManagerDashboardComponent {
  private readonly auth = inject(AdminAuthService);
  private readonly queue = inject(StagingQueueService);
  private readonly cdr = inject(ChangeDetectorRef);

  readonly statusLabels = STAGING_STATUS_LABELS;
  readonly metrics = this.queue.metrics;
  readonly readyItems = this.queue.readyForApproval;
  readonly publishedPreview = computed(() => this.queue.published().slice(0, 6));
  readonly toast = signal('');
  readonly toastOk = signal(true);
  readonly publishingId = signal<string | null>(null);

  async publish(item: StagingProduct): Promise<void> {
    const actor = this.auth.user()?.username || 'manager';
    this.publishingId.set(item.id);
    this.cdr.markForCheck();

    const ok = await this.queue.publish(item.id, actor);
    this.publishingId.set(null);
    this.toastOk.set(ok);
    this.showToast(
      ok
        ? `«${item.name}» تایید و روی سایت منتشر شد.`
        : 'انتشار انجام نشد. وضعیت کالا را بررسی کنید.'
    );
    this.cdr.markForCheck();
  }

  async publishAll(): Promise<void> {
    const actor = this.auth.user()?.username || 'manager';
    const items = [...this.readyItems()];
    if (!items.length) return;
    let count = 0;
    for (const item of items) {
      if (await this.queue.publish(item.id, actor)) count += 1;
    }
    this.toastOk.set(true);
    this.showToast(`${count} محصول تایید و منتشر شد.`);
    this.cdr.markForCheck();
  }

  async overrideToWaiting(item: StagingProduct): Promise<void> {
    const actor = this.auth.user()?.username || 'manager';
    await this.queue.overrideStatus(item.id, 'waiting_photo' as StagingStatus, actor);
    this.toastOk.set(true);
    this.showToast(`وضعیت «${item.code}» به در انتظار عکاسی بازگردانده شد.`);
    this.cdr.markForCheck();
  }

  formatDate(iso?: string): string {
    if (!iso) return '—';
    try {
      return new Intl.DateTimeFormat('fa-IR', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(new Date(iso));
    } catch {
      return iso;
    }
  }

  private showToast(message: string): void {
    this.toast.set(message);
    window.setTimeout(() => {
      if (this.toast() === message) {
        this.toast.set('');
        this.cdr.markForCheck();
      }
    }, 4000);
  }
}
