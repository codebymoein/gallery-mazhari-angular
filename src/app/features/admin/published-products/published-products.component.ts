import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import {
  BridalSampleProduct,
  CatalogProductEdit,
  getAllCatalogProducts,
  getBridalProductById,
  saveCatalogProductEdit
} from '@shared/data/bridal-collection-categories';
import { fileToCompressedDataUrl } from '@shared/utils/image-compress';
import { CATALOG_CATEGORIES } from '@shared/data/catalog-categories';
import { StagingQueueService } from '@core/services/staging-queue.service';
import { AdminAuthService } from '@core/services/admin-auth.service';
import {
  applyCatalogBackupLocally,
  downloadCatalogBackup,
  downloadCatalogExcel,
  readCatalogBackup
} from '@shared/utils/catalog-backup';

@Component({
  selector: 'app-published-products',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './published-products.component.html',
  styleUrls: ['./published-products.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PublishedProductsComponent implements OnInit {
  private readonly queue = inject(StagingQueueService);
  private readonly auth = inject(AdminAuthService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  readonly query = signal('');
  readonly revision = signal(0);
  readonly editingId = signal<string | null>(null);
  readonly toast = signal('');
  readonly returningId = signal<string | null>(null);
  private returnTo = '';
  draft: CatalogProductEdit = {};
  readonly collectionOptions = CATALOG_CATEGORIES.flatMap(category =>
    category.subcategories.map(sub => ({ slug: sub.slug, label: sub.label }))
  );

  readonly products = computed(() => {
    this.revision();
    const query = this.query().trim().toLowerCase();
    const unique = new Map<string, BridalSampleProduct>();
    for (const product of getAllCatalogProducts()) {
      const identity = ('code' in product && typeof product.code === 'string'
        ? product.code
        : product.id).trim().toUpperCase();
      unique.set(identity, product);
    }
    return [...unique.values()].filter(product => {
      const queued = this.queue.getByIdentity(this.productIdentity(product));
      if (queued && queued.status !== 'published' && queued.status !== 'awaiting_stock') return false;
      return !query || `${product.name} ${product.id} ${product.categorySlug}`.toLowerCase().includes(query);
    });
  });

  async ngOnInit(): Promise<void> {
    await this.queue.refreshFromServer();
    this.revision.update(value => value + 1);
    const requested = this.route.snapshot.queryParamMap.get('settings');
    this.returnTo = this.route.snapshot.queryParamMap.get('returnTo') || '';
    if (requested) {
      const product = this.products().find(
        item => this.productIdentity(item).trim().toUpperCase() === requested.trim().toUpperCase()
          || item.id === requested
      );
      if (product) this.edit(product);
    }
  }

  isServerPublished(product: BridalSampleProduct): boolean {
    const item = this.queue.getByIdentity(this.productIdentity(product));
    return item?.status === 'published' || item?.status === 'awaiting_stock';
  }

  async returnToQueue(product: BridalSampleProduct): Promise<void> {
    if (!this.isServerPublished(product) || this.returningId()) return;
    if (!window.confirm(`محصول «${product.name}» از سایت اصلی برداشته و به صف انتشار بازگردانده شود؟`)) return;
    const item = this.queue.getByIdentity(this.productIdentity(product));
    if (!item) {
      this.toast.set('رکورد اصلی این محصول در صف پیدا نشد.');
      return;
    }
    this.returningId.set(item.id);
    const actor = this.auth.user()?.displayName || this.auth.user()?.username || 'manager';
    const ok = await this.queue.unpublish(item.id, actor);
    this.returningId.set(null);
    if (!ok) {
      this.toast.set('بازگرداندن محصول انجام نشد. اتصال سرور و دسترسی حساب را بررسی کنید.');
      return;
    }
    this.revision.update(value => value + 1);
    this.toast.set('محصول از سایت اصلی برداشته شد و به صف انتشار بازگشت.');
    window.setTimeout(() => this.toast.set(''), 4000);
  }

  private productIdentity(product: BridalSampleProduct): string {
    return 'code' in product && typeof product.code === 'string'
      ? product.code
      : product.id;
  }

  edit(product: BridalSampleProduct): void {
    const fresh = getBridalProductById(product.id) || product;
    this.editingId.set(product.id);
    this.draft = {
      name: fresh.name,
      description: fresh.description,
      additionalDescription: fresh.additionalDescription || '',
      primaryAttributeLabel: fresh.primaryAttributeLabel || this.defaultPrimaryLabel(fresh),
      primaryAttributeValue: fresh.primaryAttributeValue || fresh.heelHeight || fresh.platformHeight || fresh.silhouette,
      secondaryAttributeLabel: fresh.secondaryAttributeLabel || this.defaultSecondaryLabel(fresh),
      secondaryAttributeValue: fresh.secondaryAttributeValue || fresh.material || fresh.fabric,
      highlights: [...fresh.highlights],
      gallery: [...(fresh.gallery?.length ? fresh.gallery : [fresh.image])]
      ,collectionSlugs: [...(fresh.collectionSlugs || [fresh.categorySlug])]
    };
  }

  close(): void { this.editingId.set(null); }

  highlightText(): string { return (this.draft.highlights || []).join('\n'); }
  updateHighlights(value: string): void {
    this.draft.highlights = value.split('\n').map(item => item.trim()).filter(Boolean);
  }

  async addImages(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files || []).filter(file => file.type.startsWith('image/'));
    input.value = '';
    if (!files.length) return;
    const images = await Promise.all(files.map(file => fileToCompressedDataUrl(file)));
    this.draft.gallery = [...(this.draft.gallery || []), ...images].slice(0, 8);
  }

  removeImage(index: number): void {
    this.draft.gallery = (this.draft.gallery || []).filter((_item, i) => i !== index);
  }

  setPrimaryImage(index: number): void {
    const gallery = [...(this.draft.gallery || [])];
    if (index <= 0 || index >= gallery.length) return;
    const [primary] = gallery.splice(index, 1);
    this.draft.gallery = [primary, ...gallery];
  }

  collectionChecked(slug: string): boolean {
    return (this.draft.collectionSlugs || []).includes(slug);
  }

  toggleCollection(slug: string, checked: boolean): void {
    const values = new Set(this.draft.collectionSlugs || []);
    if (checked) {
      values.add(slug);
    } else {
      values.delete(slug);
    }
    this.draft.collectionSlugs = [...values];
  }

  async save(): Promise<void> {
    const id = this.editingId();
    if (!id || !this.draft.name?.trim()) return;
    const gallery = (this.draft.gallery || []).filter(Boolean);
    const item = this.queue.getByIdentity(id);
    const primaryIndex = item
      ? (item.photos || []).findIndex(photo => photo.url === gallery[0])
      : -1;
    if (item && primaryIndex > 0) {
      const changed = await this.queue.setPrimaryPhoto(item.id, primaryIndex);
      if (!changed) {
        this.toast.set('انتخاب عکس اصلی روی سرور ذخیره نشد.');
        return;
      }
    }
    saveCatalogProductEdit(id, {
      ...this.draft,
      name: this.draft.name.trim(),
      gallery,
      image: gallery[0]
    });
    this.revision.update(value => value + 1);
    this.editingId.set(null);
    this.toast.set('تغییرات محصول ذخیره و روی ویترین اعمال شد.');
    if (this.returnTo.startsWith('/product/')) {
      await this.router.navigateByUrl(this.returnTo);
      return;
    }
    window.setTimeout(() => this.toast.set(''), 3500);
  }

  exportBackup(): void {
    downloadCatalogBackup();
    this.toast.set('فایل پشتیبان کامل دانلود شد.');
  }

  exportExcel(): void {
    downloadCatalogExcel();
    this.toast.set('فایل Excel کامل محصولات دانلود شد.');
  }

  async importBackup(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    try {
      const backup = await readCatalogBackup(file);
      applyCatalogBackupLocally(backup);
      await this.queue.restoreBackup(backup.queue.length ? backup.queue : backup.published);
      this.revision.update(value => value + 1);
      this.toast.set('محصولات، عکس‌ها و تمام تنظیمات از فایل بازیابی شدند.');
    } catch {
      this.toast.set('فایل انتخاب‌شده پشتیبان معتبر گالری مظهری نیست.');
    }
  }

  private defaultPrimaryLabel(product: BridalSampleProduct): string {
    if (product.categorySlug === 'bridal-shoes') return 'ارتفاع پاشنه';
    if (product.categorySlug === 'bridal-sneakers') return 'ارتفاع لژ';
    return 'ویژگی اصلی';
  }

  private defaultSecondaryLabel(product: BridalSampleProduct): string {
    return product.categorySlug.includes('shoe') || product.categorySlug.includes('sneaker')
      ? 'جنس رویه' : 'جنس / متریال';
  }
}
