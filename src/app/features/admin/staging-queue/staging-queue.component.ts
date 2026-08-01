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
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
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
import { CatalogProductEdit, loadCatalogProductEdits, saveCatalogProductEdit } from '@shared/data/bridal-collection-categories';
import { CATALOG_CATEGORIES } from '@shared/data/catalog-categories';
import { internalTagsForCategory } from '@shared/data/product-internal-tags';
import {
  applyCatalogBackupLocally,
  downloadCatalogBackup,
  downloadCatalogExcel,
  readCatalogBackup
} from '@shared/utils/catalog-backup';

@Component({
  selector: 'app-staging-queue',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './staging-queue.component.html',
  styleUrls: ['./staging-queue.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class StagingQueueComponent {
  private readonly auth = inject(AdminAuthService);
  private readonly queue = inject(StagingQueueService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private returnTo = '';

  constructor() {
    this.route.queryParamMap.subscribe(params => {
      const requested = params.get('settings');
      this.returnTo = params.get('returnTo') || '';
      if (!requested) return;
      window.setTimeout(() => {
        const item = this.queue.items().find(row => row.id === requested || row.code === requested);
        if (item) this.openPreview(item);
      });
    });
  }

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
  readonly previewId = signal<string | null>(null);
  previewDraft: CatalogProductEdit = {};
  readonly catalogOptions = CATALOG_CATEGORIES.flatMap(parent => [
    {
      value: `${parent.slug}|${parent.slug}`,
      label: `${parent.title} (دسته اصلی)`,
      parent,
      sub: { label: parent.title, slug: parent.slug }
    },
    ...parent.subcategories.map(sub => ({
      value: `${parent.slug}|${sub.slug}`,
      label: `${parent.title} ← ${sub.label}`,
      parent,
      sub
    }))
  ]);
  readonly catalogDrafts: Record<string, string> = {};
  readonly tagDrafts: Record<string, Set<string>> = {};

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
    let items =
      cat === 'trash'
        ? this.queue.rejected()
        : cat === 'awaiting-stock'
          ? this.queue.awaitingStock()
        : this.queue.pendingItems();

    if (cat !== 'trash' && cat !== 'awaiting-stock' && status !== 'all') {
      items = items.filter((i) => i.status === status);
    }

    if (cat !== 'all' && cat !== 'trash' && cat !== 'awaiting-stock') {
      items = items.filter((i) =>
        cat === NEW_PRODUCT_CATEGORY_SLUG
          ? !!i.isNewImport || i.parentCategorySlug === NEW_PRODUCT_CATEGORY_SLUG
          : cat === 'unconventional'
            ? !i.parentCategorySlug ||
              i.parentCategorySlug === NEW_PRODUCT_CATEGORY_SLUG ||
              i.parentCategorySlug === 'unconventional'
            : i.parentCategorySlug === cat
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
    return [...items].sort((a, b) => {
      const photoDifference = this.photoCount(b) - this.photoCount(a);
      if (photoDifference) return photoDifference;
      const aTime = Date.parse(a.processedAt || a.importedAt || '') || 0;
      const bTime = Date.parse(b.processedAt || b.importedAt || '') || 0;
      return bTime - aTime;
    });
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

  suggestedCatalog(item: StagingProduct): string {
    const text = `${item.name} ${item.code} ${item.category} ${(item.photos || []).map(photo => photo.fileName).join(' ')}`.toLowerCase();
    const scored = this.catalogOptions.map(option => {
      const words = option.sub.label.toLowerCase().split(/\s+/);
      const score = words.filter(word => word.length > 2 && text.includes(word)).length +
        (text.includes(option.sub.slug.replace(/-/g, ' ')) ? 2 : 0);
      return { option, score };
    }).sort((a, b) => b.score - a.score);
    return scored[0]?.score ? scored[0].option.value : '';
  }

  catalogValue(item: StagingProduct): string {
    return this.catalogDrafts[item.id]
      ?? (item.parentCategorySlug && item.categorySlug
        ? `${item.parentCategorySlug}|${item.categorySlug}`
        : this.suggestedCatalog(item));
  }

  changeCatalog(item: StagingProduct, value: string): void {
    this.catalogDrafts[item.id] = value;
    const option = this.catalogOptions.find(row => row.value === value);
    if (!option) return;
    const current = new Set(item.hiddenTags || []);
    const name = `${item.name} ${item.category}`.toLowerCase();
    const candidates = internalTagsForCategory(option.sub.slug);
    current.add(option.sub.label);
    for (const tag of candidates) {
      const meaningful = tag.replace(option.sub.label, '').trim();
      if (meaningful.length >= 3 && name.includes(meaningful.toLowerCase())) current.add(tag);
      if (['ایرانی', 'وارداتی', 'اقتصادی', 'دست‌ساز', 'رنگی', 'اروپایی', 'عربی']
        .some(keyword => tag.includes(keyword) && name.includes(keyword))) current.add(tag);
    }
    this.tagDrafts[item.id] = current;
    this.cdr.markForCheck();
  }

  availableTags(item: StagingProduct): string[] {
    const value = this.catalogValue(item);
    const slug = value.split('|')[1] || item.categorySlug;
    return slug ? internalTagsForCategory(slug) : [];
  }

  selectedTags(item: StagingProduct): Set<string> {
    if (!this.tagDrafts[item.id]) this.tagDrafts[item.id] = new Set(item.hiddenTags || []);
    return this.tagDrafts[item.id];
  }

  toggleTag(item: StagingProduct, tag: string, checked: boolean): void {
    const selected = this.selectedTags(item);
    if (checked) {
      selected.add(tag);
    } else {
      selected.delete(tag);
    }
    this.cdr.markForCheck();
  }

  addCustomTag(item: StagingProduct, input: HTMLInputElement): void {
    const tag = input.value.trim();
    if (!tag) return;
    this.selectedTags(item).add(tag);
    input.value = '';
    this.cdr.markForCheck();
  }

  async assignCatalog(item: StagingProduct, value: string): Promise<void> {
    const selected = this.catalogOptions.find(option => option.value === value);
    if (!selected) return;
    const ok = await this.queue.updateCatalog(item.id, {
      category: selected.sub.label,
      categorySlug: selected.sub.slug,
      parentCategory: selected.parent.title,
      parentCategorySlug: selected.parent.slug,
      hiddenTags: [...this.selectedTags(item)]
    });
    this.showToast(ok ? 'دسته‌بندی کالا ذخیره شد.' : 'ذخیره دسته‌بندی انجام نشد.');
    this.cdr.markForCheck();
  }

  setCategory(slug: string): void {
    this.categorySlug.set(slug);
    if (slug !== 'trash' && slug !== 'awaiting-stock') {
      this.statusFilter.set('all');
    }
    this.page.set(1);
    this.cdr.markForCheck();
  }

  scrollCategories(container: HTMLElement, direction: -1 | 1): void {
    container.scrollBy({ left: direction * 280, behavior: 'smooth' });
  }

  scrollCategoriesWheel(event: WheelEvent, container: HTMLElement): void {
    if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return;
    event.preventDefault();
    container.scrollBy({ left: event.deltaY, behavior: 'auto' });
  }

  onCategoryKeydown(event: KeyboardEvent, container: HTMLElement): void {
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      this.scrollCategories(container, -1);
    } else if (event.key === 'ArrowRight') {
      event.preventDefault();
      this.scrollCategories(container, 1);
    } else if (event.key === 'Home') {
      event.preventDefault();
      container.scrollTo({ left: 0, behavior: 'smooth' });
    } else if (event.key === 'End') {
      event.preventDefault();
      container.scrollTo({ left: container.scrollWidth, behavior: 'smooth' });
    }
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

  openPreview(item: StagingProduct): void {
    const stored = loadCatalogProductEdits()[item.id] || {};
    this.previewDraft = {
      name: item.name,
      description: item.notes || `${item.name}، کد کالا ${item.code}`,
      additionalDescription: '',
      primaryAttributeLabel: item.heelHeight ? 'ارتفاع پاشنه' : item.platformHeight ? 'ارتفاع لژ' : 'ویژگی اصلی',
      primaryAttributeValue: normalizedFootwearHeight(
        item.heelHeight || item.platformHeight,
        item.name
      ),
      secondaryAttributeLabel: 'جنس / متریال',
      secondaryAttributeValue: item.material || '',
      highlights: [item.size ? `سایز ${item.size}` : '', `موجودی: ${item.stock}`].filter(Boolean),
      gallery: (item.photos || []).map(photo => photo.url),
      ...stored
    };
    this.selectedTags(item);
    this.previewId.set(item.id);
    this.cdr.detectChanges();
  }

  closePreview(): void { this.previewId.set(null); }

  async setPrimaryPhoto(item: StagingProduct, index: number): Promise<void> {
    if (index === 0) return;
    const ok = await this.queue.setPrimaryPhoto(item.id, index);
    if (ok) {
      const gallery = [...(this.previewDraft.gallery || [])];
      const selectedUrl = item.photos[index]?.url;
      const draftIndex = gallery.indexOf(selectedUrl);
      if (draftIndex > 0) {
        const [primary] = gallery.splice(draftIndex, 1);
        this.previewDraft.gallery = [primary, ...gallery];
      }
    }
    this.showToast(ok ? 'عکس اصلی محصول تغییر کرد.' : 'تغییر عکس اصلی انجام نشد.');
    this.cdr.markForCheck();
  }

  previewItem(): StagingProduct | undefined {
    return this.queue.items().find(item => item.id === this.previewId());
  }

  async savePreviewChanges(): Promise<void> {
    const item = this.previewItem();
    if (!item) return;
    const gallery = (this.previewDraft.gallery || []).filter(Boolean);
    saveCatalogProductEdit(item.id, { ...this.previewDraft, gallery, image: gallery[0] });
    const selected = this.catalogOptions.find(option => option.value === this.catalogValue(item));
    if (selected) {
      await this.queue.updateCatalog(item.id, {
        category: selected.sub.label,
        categorySlug: selected.sub.slug,
        parentCategory: selected.parent.title,
        parentCategorySlug: selected.parent.slug,
        hiddenTags: [...this.selectedTags(item)]
      });
    }
    this.showToast('تمام تنظیمات محصول ذخیره شد.');
    this.closePreview();
    if (this.returnTo.startsWith('/admin/')) {
      await this.router.navigateByUrl(this.returnTo);
    }
  }

  async sendToManager(item: StagingProduct): Promise<void> {
    if (!this.photoCount(item)) {
      this.showToast('محصول بدون عکس قابل ارسال به مدیر نیست.');
      return;
    }
    const actor = this.auth.user()?.username || 'staff';
    const ok = await this.queue.overrideStatus(item.id, 'ready_for_approval', actor);
    this.showToast(ok
      ? 'محصول برای بررسی و انتشار به پنل مدیر ارسال شد.'
      : 'ارسال محصول به مدیر انجام نشد.');
    this.cdr.markForCheck();
  }

  async moveToTrash(item: StagingProduct): Promise<void> {
    const actor = this.auth.user()?.username || 'staff';
    const ok = await this.queue.overrideStatus(item.id, 'rejected', actor);
    this.showToast(
      ok
        ? `«${item.name}» به زباله‌دان منتقل شد.`
        : 'انتقال محصول به زباله‌دان انجام نشد.'
    );
    this.cdr.markForCheck();
  }

  async restoreFromTrash(item: StagingProduct): Promise<void> {
    const actor = this.auth.user()?.username || 'staff';
    const destination =
      item.trashedFromStatus && item.trashedFromStatus !== 'rejected'
        ? item.trashedFromStatus
        : this.photoCount(item)
          ? 'ready_for_approval'
          : 'waiting_photo';
    const ok = await this.queue.overrideStatus(item.id, destination, actor);
    this.showToast(
      ok
        ? `«${item.name}» به دسته و وضعیت قبلی بازگردانده شد.`
        : 'بازگردانی محصول انجام نشد.'
    );
    this.cdr.markForCheck();
  }

  exportBackup(): void {
    downloadCatalogBackup();
    this.showToast('فایل پشتیبان کامل محصولات دانلود شد.');
  }

  exportExcel(): void {
    downloadCatalogExcel();
    this.showToast('فایل Excel کامل محصولات دانلود شد.');
  }

  async importBackup(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    try {
      const backup = await readCatalogBackup(file);
      applyCatalogBackupLocally(backup);
      const rows = backup.queue.length ? backup.queue : backup.published;
      const restored = await this.queue.restoreBackup(rows);
      this.showToast(`${restored} محصول و تنظیمات آن‌ها با موفقیت بازیابی شد.`);
      this.cdr.markForCheck();
    } catch {
      this.showToast('فایل پشتیبان معتبر نیست یا بازیابی آن انجام نشد.');
    }
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

function normalizedFootwearHeight(value: string | undefined, productName: string): string {
  const clean = (value || '').trim();
  if (clean && !clean.includes('?') && !clean.includes('�')) {
    return clean;
  }
  const model = productName.trim().split(/\s+/)[0] || '';
  const match = /-(\d+(?:[.,]\d+)?)$/.exec(model);
  return match ? `${match[1].replace(',', '.')} سانتی‌متر` : clean;
}
