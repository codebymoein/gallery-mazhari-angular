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
import { AdminAuthService } from '@core/services/admin-auth.service';
import { StagingQueueService } from '@core/services/staging-queue.service';
import {
  MAX_STAGING_PHOTOS,
  NEW_PRODUCT_CATEGORY_LABEL,
  NEW_PRODUCT_CATEGORY_SLUG,
  STAGING_STATUS_LABELS,
  StagingProduct
} from '@shared/models/staging-product.model';
import { fileToCompressedDataUrl } from '@shared/utils/image-compress';

@Component({
  selector: 'app-staging-queue',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './staging-queue.component.html',
  styleUrls: ['./staging-queue.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class StagingQueueComponent {
  private readonly auth = inject(AdminAuthService);
  private readonly queue = inject(StagingQueueService);
  private readonly cdr = inject(ChangeDetectorRef);

  readonly statusLabels = STAGING_STATUS_LABELS;
  readonly maxPhotos = MAX_STAGING_PHOTOS;
  readonly newLabel = NEW_PRODUCT_CATEGORY_LABEL;
  readonly pageSize = 8;
  readonly page = signal(1);
  readonly statusFilter = signal<'all' | 'waiting_photo' | 'ready_for_approval'>('all');
  readonly categorySlug = signal<string>('all');
  readonly query = signal('');
  readonly toast = signal('');
  readonly uploadingId = signal<string | null>(null);
  readonly expandedId = signal<string | null>(null);

  readonly pendingCount = computed(() => this.queue.pendingItems().length);
  readonly waitingCount = computed(() => this.queue.waitingPhoto().length);
  readonly readyCount = computed(() => this.queue.readyForApproval().length);
  readonly categoryGroups = this.queue.categoryGroups;
  readonly newCount = computed(
    () =>
      this.queue.pendingItems().filter((i) => i.isNewImport || i.parentCategorySlug === NEW_PRODUCT_CATEGORY_SLUG)
        .length
  );

  readonly filtered = computed(() => {
    const status = this.statusFilter();
    const cat = this.categorySlug();
    const q = this.query().trim().toLowerCase();
    let items = this.queue.pendingItems();

    if (status !== 'all') items = items.filter((i) => i.status === status);

    if (cat !== 'all') {
      items = items.filter((i) =>
        cat === NEW_PRODUCT_CATEGORY_SLUG
          ? !!i.isNewImport || i.parentCategorySlug === NEW_PRODUCT_CATEGORY_SLUG
          : i.parentCategorySlug === cat && !i.isNewImport
      );
    }

    if (q) {
      items = items.filter(
        (i) =>
          i.code.toLowerCase().includes(q) ||
          i.name.toLowerCase().includes(q) ||
          i.category.toLowerCase().includes(q) ||
          i.parentCategory.toLowerCase().includes(q)
      );
    }
    return items;
  });

  readonly totalPages = computed(() =>
    Math.max(1, Math.ceil(this.filtered().length / this.pageSize))
  );

  readonly pageItems = computed(() => {
    const p = Math.min(this.page(), this.totalPages());
    const start = (p - 1) * this.pageSize;
    return this.filtered().slice(start, start + this.pageSize);
  });

  setStatusFilter(value: 'all' | 'waiting_photo' | 'ready_for_approval'): void {
    this.statusFilter.set(value);
    this.page.set(1);
  }

  setCategory(slug: string): void {
    this.categorySlug.set(slug);
    this.page.set(1);
  }

  onSearch(value: string): void {
    this.query.set(value);
    this.page.set(1);
  }

  prevPage(): void {
    this.page.update((p) => Math.max(1, p - 1));
  }

  nextPage(): void {
    this.page.update((p) => Math.min(this.totalPages(), p + 1));
  }

  toggleExpand(id: string): void {
    this.expandedId.update((cur) => (cur === id ? null : id));
  }

  photoCount(item: StagingProduct): number {
    return item.photos?.length || (item.photoUrl ? 1 : 0);
  }

  canAddMore(item: StagingProduct): boolean {
    return this.photoCount(item) < this.maxPhotos;
  }

  openFilePicker(input: HTMLInputElement): void {
    input.click();
  }

  onPhotosSelected(item: StagingProduct, event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files || []);
    input.value = '';
    if (!files.length) return;

    const room = this.maxPhotos - this.photoCount(item);
    if (room <= 0) {
      this.showToast(`حداکثر ${this.maxPhotos} عکس برای هر محصول مجاز است.`);
      return;
    }

    const imageFiles = files.filter((f) => f.type.startsWith('image/')).slice(0, room);
    if (!imageFiles.length) {
      this.showToast('لطفاً فایل تصویری انتخاب کنید.');
      return;
    }

    this.uploadingId.set(item.id);
    this.cdr.markForCheck();

    Promise.all(
      imageFiles.map(async (file) => ({
        url: await fileToCompressedDataUrl(file),
        fileName: file.name
      }))
    )
      .then(async (photos) => {
        const actor = this.auth.user()?.username || 'staff';
        const result = await this.queue.attachPhotos(item.id, photos, actor);
        this.uploadingId.set(null);
        this.showToast(
          result.ok
            ? `${result.message} وضعیت: ${result.total > 0 ? 'آماده‌ی تایید مدیر' : 'در انتظار عکاسی'}`
            : result.message
        );
        this.expandedId.set(item.id);
        this.cdr.markForCheck();
      })
      .catch(() => {
        this.uploadingId.set(null);
        this.showToast('خواندن یک یا چند فایل تصویر با خطا مواجه شد.');
        this.cdr.markForCheck();
      });
  }

  async removePhoto(item: StagingProduct, index: number): Promise<void> {
    if (await this.queue.removePhoto(item.id, index)) {
      this.showToast('عکس حذف شد.');
      this.cdr.markForCheck();
    }
  }

  private showToast(message: string): void {
    this.toast.set(message);
    window.setTimeout(() => {
      if (this.toast() === message) {
        this.toast.set('');
        this.cdr.markForCheck();
      }
    }, 4200);
  }
}
