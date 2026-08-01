
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AppearanceApiService, SiteAppearance, SiteMemory } from '@core/services/appearance-api.service';
import { CATALOG_CATEGORIES } from '@shared/data/catalog-categories';
import { assetUrl } from '@shared/utils/asset-url';
import { finalize } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { PlatformApiService } from '@core/services/platform-api.service';
import { AdminInventoryService } from '@core/services/admin-inventory.service';
import { RouterLink } from '@angular/router';
import { ProductsApiService } from '@core/services/products-api.service';
import { PaymentApiService, PaymentSettings } from '@core/services/payment-api.service';
import { NotificationApiService, NotificationSettings } from '@core/services/notification-api.service';

@Component({
  selector: 'app-appearance-manager',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './appearance-manager.component.html',
  styleUrls: ['./appearance-manager.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppearanceManagerComponent {
  private readonly api = inject(AppearanceApiService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);
  private readonly platformApi = inject(PlatformApiService);
  private readonly inventory = inject(AdminInventoryService);
  private readonly productsApi = inject(ProductsApiService);
  private readonly paymentApi = inject(PaymentApiService);
  private readonly notificationApi = inject(NotificationApiService);
  model: SiteAppearance = {
    id: 1, categoryImages: {}, subcategoryImages: {},
    categoryOrder: CATALOG_CATEGORIES.map(category => category.slug),
    subcategoryOrder: {}
  };
  saving = false;
  message = '';
  error = '';
  styles: unknown[] = [];
  styleSaving = false;
  hotspotProductCode = '';
  styleProductQuery = '';
  styleProducts: Array<{ code: string; name: string; category: string; photoUrl?: string }> = [];
  styleDraft = this.emptyStyle();
  paymentSaving = false;
  payment: PaymentSettings = {
    enabled: false,
    provider: 'disabled',
    displayName: 'پرداخت آنلاین',
    merchantId: '',
    customRequestUrl: '',
    customVerifyUrl: '',
    customPaymentUrlTemplate: '',
    customApiKey: '',
    sandbox: false
  };
  notificationSaving = false;
  notificationTesting: '' | 'telegram' | 'sms' = '';
  telegramChatIdsText = '';
  smsRecipientsText = '';
  notification: NotificationSettings = {
    enabled: false, mode: 'disabled', telegramBotToken: '', telegramChatIds: [],
    smsApiUrl: '', smsApiKey: '', smsSender: '', smsRecipients: [],
    smsAuthHeader: 'Authorization', smsAuthScheme: 'Bearer', timeoutMs: 8000
  };

  constructor() {
    this.api.load();
    const timer = window.setInterval(() => {
      const loaded = this.api.appearance();
      if (!loaded) return;
      window.clearInterval(timer);
      this.model = {
        ...loaded,
        categoryImages: { ...(loaded.categoryImages ?? {}) },
        subcategoryImages: { ...(loaded.subcategoryImages ?? {}) },
        categoryOrder: loaded.categoryOrder?.length
          ? [...loaded.categoryOrder]
          : CATALOG_CATEGORIES.map(category => category.slug),
        subcategoryOrder: { ...(loaded.subcategoryOrder ?? {}) }
      };
      this.cdr.markForCheck();
    }, 50);
    this.destroyRef.onDestroy(() => window.clearInterval(timer));
    this.loadStyles();
    this.loadPublishedProducts();
    this.loadPaymentSettings();
    this.loadNotificationSettings();
  }

  loadNotificationSettings(): void {
    this.notificationApi.settings().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: value => {
        this.notification = { ...this.notification, ...value };
        this.telegramChatIdsText = (value.telegramChatIds || []).join('\n');
        this.smsRecipientsText = (value.smsRecipients || []).join('\n');
        this.cdr.markForCheck();
      },
      error: err => { this.error = err?.error?.message || 'خواندن تنظیمات اعلان انجام نشد.'; this.cdr.markForCheck(); }
    });
  }

  saveNotificationSettings(): void {
    this.notificationSaving = true; this.error = ''; this.message = '';
    const value = { ...this.notification, telegramChatIds: this.lines(this.telegramChatIdsText), smsRecipients: this.lines(this.smsRecipientsText) };
    if (value.enabled && ['telegram', 'auto', 'both'].includes(value.mode) && (!value.telegramBotToken || !value.telegramChatIds.length)) {
      this.notificationSaving = false;
      this.error = 'برای تلگرام، Token بات و حداقل یک Chat ID الزامی است.';
      this.cdr.markForCheck();
      return;
    }
    this.notificationApi.save(value).pipe(finalize(() => { this.notificationSaving = false; this.cdr.markForCheck(); }), takeUntilDestroyed(this.destroyRef)).subscribe({
      next: saved => { this.notification = { ...this.notification, ...saved }; this.message = 'تنظیمات بات و SMS ذخیره شد.'; },
      error: err => { const detail = err?.error?.message; this.error = Array.isArray(detail) ? detail.join('، ') : detail || 'ذخیره تنظیمات اعلان انجام نشد.'; }
    });
  }

  testNotification(channel: 'telegram' | 'sms'): void {
    this.notificationTesting = channel; this.error = ''; this.message = '';
    this.notificationApi.test(channel).pipe(finalize(() => { this.notificationTesting = ''; this.cdr.markForCheck(); }), takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => { this.message = `پیام تست ${channel === 'telegram' ? 'تلگرام' : 'SMS'} ارسال شد.`; },
      error: err => { this.error = err?.error?.message || 'ارسال پیام تست ناموفق بود.'; }
    });
  }

  private lines(value: string): string[] { return [...new Set(value.split(/[\n,]+/).map(item => item.trim()).filter(Boolean))]; }

  loadPaymentSettings(): void {
    this.paymentApi.adminSettings()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: value => {
          this.payment = { ...this.payment, ...value };
          this.cdr.markForCheck();
        },
        error: err => {
          this.error = err?.error?.message || 'خواندن تنظیمات درگاه انجام نشد.';
          this.cdr.markForCheck();
        }
      });
  }

  savePaymentSettings(): void {
    this.paymentSaving = true;
    this.error = '';
    this.message = '';
    this.paymentApi.saveSettings(this.payment)
      .pipe(
        finalize(() => {
          this.paymentSaving = false;
          this.cdr.markForCheck();
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: value => {
          this.payment = { ...this.payment, ...value };
          this.message = 'تنظیمات درگاه پرداخت ذخیره شد.';
        },
        error: err => {
          const detail = err?.error?.message;
          this.error = Array.isArray(detail) ? detail.join('، ') : detail || 'ذخیره تنظیمات درگاه انجام نشد.';
        }
      });
  }

  get categories() {
    const rank = new Map((this.model.categoryOrder || []).map((slug, index) => [slug, index]));
    return [...CATALOG_CATEGORIES].sort((a, b) =>
      (rank.get(a.slug) ?? 999) - (rank.get(b.slug) ?? 999)
    );
  }

  moveCategory(slug: string, direction: -1 | 1): void {
    const order = this.categories.map(category => category.slug);
    moveInOrder(order, slug, direction);
    this.model.categoryOrder = order;
  }

  moveSubcategory(categorySlug: string, slug: string, direction: -1 | 1): void {
    const category = CATALOG_CATEGORIES.find(item => item.slug === categorySlug);
    if (!category) return;
    const saved = this.model.subcategoryOrder?.[categorySlug];
    const order = saved?.length ? [...saved] : category.subcategories.map(item => item.slug);
    moveInOrder(order, slug, direction);
    this.model.subcategoryOrder = { ...(this.model.subcategoryOrder || {}), [categorySlug]: order };
  }

  orderedSubcategories(category: (typeof CATALOG_CATEGORIES)[number]) {
    const rank = new Map(
      (this.model.subcategoryOrder?.[category.slug] || []).map((slug, index) => [slug, index])
    );
    return [...category.subcategories].sort((a, b) =>
      (rank.get(a.slug) ?? 999) - (rank.get(b.slug) ?? 999)
    );
  }

  get publishedProducts() {
    const query = this.styleProductQuery.trim().toLocaleLowerCase('fa');
    const products = this.styleProducts.length
      ? this.styleProducts
      : this.inventory.items().filter(item => item.status === 'active' || item.status === 'out_of_stock');
    if (!query) return products;
    return products.filter(item =>
      item.code.toLocaleLowerCase('fa').includes(query) ||
      item.name.toLocaleLowerCase('fa').includes(query) ||
      item.category.toLocaleLowerCase('fa').includes(query)
    );
  }

  loadPublishedProducts(): void {
    this.productsApi.getPublished().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: products => {
        this.styleProducts = products.map(product => ({
          code: product.code,
          name: product.name,
          category: product.category,
          photoUrl: product.photos?.[0]?.url
        }));
        this.cdr.markForCheck();
      },
      error: () => { this.styleProducts = []; this.cdr.markForCheck(); }
    });
  }

  private emptyStyle() {
    return {
      id: '', name: '', slug: '', subtitle: '', story: '', style: '', mood: '',
      ceremony: '', productCodes: '', images: [] as string[],
      hotspots: [] as Array<{ imageIndex: number; productCode: string; x: number; y: number; label: string }>,
      status: 'draft', displayPriority: 0
    };
  }

  newStyle(): void {
    this.styleDraft = this.emptyStyle();
    this.hotspotProductCode = '';
  }

  loadStyles(): void {
    this.platformApi.listLooks().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: rows => { this.styles = rows || []; this.cdr.markForCheck(); },
      error: () => undefined
    });
  }

  editStyle(value: unknown): void {
    const row = (value || {}) as Record<string, unknown>;
    this.styleDraft = {
      id: String(row['id'] || ''), name: String(row['name'] || ''),
      slug: String(row['slug'] || ''), subtitle: String(row['subtitle'] || ''),
      story: String(row['story'] || ''), style: String(row['style'] || ''),
      mood: String(row['mood'] || ''), ceremony: String(row['ceremony'] || ''),
      productCodes: Array.isArray(row['productCodes']) ? (row['productCodes'] as string[]).join(', ') : '',
      images: Array.isArray(row['images']) ? [...row['images'] as string[]] : [],
      hotspots: Array.isArray(row['hotspots'])
        ? [...row['hotspots'] as Array<{ imageIndex: number; productCode: string; x: number; y: number; label: string }>]
        : [],
      status: String(row['status'] || 'draft'),
      displayPriority: Number(row['displayPriority'] || 0)
    };
    this.hotspotProductCode = '';
  }

  chooseStyleImages(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files ?? []).slice(0, 5 - this.styleDraft.images.length);
    for (const file of files) {
      if (!file.type.startsWith('image/') || file.size > 8 * 1024 * 1024) continue;
      const reader = new FileReader();
      reader.onload = () => {
        this.styleDraft.images = [...this.styleDraft.images, String(reader.result || '')].slice(0, 5);
        this.cdr.markForCheck();
      };
      reader.readAsDataURL(file);
    }
    input.value = '';
  }

  removeStyleImage(index: number): void {
    this.styleDraft.images = this.styleDraft.images.filter((_, i) => i !== index);
    this.styleDraft.hotspots = this.styleDraft.hotspots
      .filter(point => point.imageIndex !== index)
      .map(point => ({ ...point, imageIndex: point.imageIndex > index ? point.imageIndex - 1 : point.imageIndex }));
  }

  hasStyleProduct(code: string): boolean {
    return this.styleDraft.productCodes.split(/[,\s]+/).includes(code);
  }

  toggleStyleProduct(code: string, checked: boolean): void {
    const codes = new Set(this.styleDraft.productCodes.split(/[,\s]+/).filter(Boolean));
    if (checked) {
      codes.add(code);
    } else {
      codes.delete(code);
    }
    this.styleDraft.productCodes = [...codes].join(', ');
    if (!checked) this.styleDraft.hotspots = this.styleDraft.hotspots.filter(point => point.productCode !== code);
  }

  selectHotspotProduct(code: string): void {
    this.hotspotProductCode = code;
    if (!this.hasStyleProduct(code)) this.toggleStyleProduct(code, true);
    this.message = 'اکنون محل این محصول را روی یکی از تصاویر استایل لمس کنید.';
  }

  placeStyleHotspot(event: Event, imageIndex: number): void {
    if (!this.hotspotProductCode) return;
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    const clientX = event instanceof MouseEvent ? event.clientX : rect.left + rect.width / 2;
    const clientY = event instanceof MouseEvent ? event.clientY : rect.top + rect.height / 2;
    const product = this.publishedProducts.find(item => item.code === this.hotspotProductCode);
    const point = {
      imageIndex, productCode: this.hotspotProductCode,
      x: Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100)),
      y: Math.max(0, Math.min(100, ((clientY - rect.top) / rect.height) * 100)),
      label: product?.name || this.hotspotProductCode
    };
    this.styleDraft.hotspots = [
      ...this.styleDraft.hotspots.filter(item => !(item.imageIndex === imageIndex && item.productCode === point.productCode)),
      point
    ];
    this.hotspotProductCode = '';
  }

  removeStyleHotspot(index: number): void {
    this.styleDraft.hotspots = this.styleDraft.hotspots.filter((_, i) => i !== index);
  }

  saveStyle(publish: boolean): void {
    if (!this.styleDraft.name.trim() || !this.styleDraft.images.length) {
      this.error = 'نام استایل و حداقل یک تصویر الزامی است.';
      return;
    }
    this.styleSaving = true; this.error = ''; this.message = '';
    const productCodes = this.styleDraft.productCodes.split(/[,\s]+/).filter(Boolean);
    this.platformApi.saveLook({
      ...this.styleDraft,
      id: this.styleDraft.id || undefined,
      productCodes,
      coverImageUrl: this.styleDraft.images[0],
      status: publish ? 'published' : 'draft'
    }).pipe(finalize(() => { this.styleSaving = false; this.cdr.markForCheck(); }), takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: value => {
          this.editStyle(value);
          this.message = publish ? 'استایل منتشر شد و در صفحه استایل‌ها قابل مشاهده است.' : 'پیش‌نویس استایل ذخیره شد.';
          this.loadStyles();
        },
        error: err => { this.error = err?.error?.message || 'ذخیره استایل انجام نشد.'; }
      });
  }

  image(kind: 'bridal' | 'accessory' | 'consultation' | 'category' | 'subcategory', key?: string): string {
    if (kind === 'bridal') return this.model.bridalHeroImage || assetUrl('assets/images/home-hero-bride.webp');
    if (kind === 'accessory') return this.model.accessoryHeroImage || assetUrl('assets/images/bridal-hair-accessories.webp');
    if (kind === 'consultation') return this.model.consultationImage || assetUrl('assets/images/home-complete-selection.webp');
    const category = this.categories.find(item => item.slug === key);
    if (kind === 'category') return this.model.categoryImages?.[key || ''] || assetUrl(category?.image);
    const parent = this.categories.find(item => item.subcategories.some(sub => sub.slug === key));
    return this.model.subcategoryImages?.[key || ''] || this.model.categoryImages?.[parent?.slug || ''] || assetUrl(parent?.image);
  }

  choose(event: Event, kind: 'bridal' | 'accessory' | 'consultation' | 'category' | 'subcategory', key?: string): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/') || file.size > 8 * 1024 * 1024) {
      this.error = 'فقط تصویر با حجم حداکثر ۸ مگابایت قابل انتخاب است.';
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const value = String(reader.result || '');
      if (kind === 'bridal') this.model.bridalHeroImage = value;
      else if (kind === 'accessory') this.model.accessoryHeroImage = value;
      else if (kind === 'consultation') this.model.consultationImage = value;
      else if (kind === 'category' && key) this.model.categoryImages = { ...this.model.categoryImages, [key]: value };
      else if (key) this.model.subcategoryImages = { ...this.model.subcategoryImages, [key]: value };
      this.cdr.markForCheck();
    };
    reader.readAsDataURL(file);
  }

  reset(kind: 'bridal' | 'accessory' | 'consultation' | 'category' | 'subcategory', key?: string): void {
    if (kind === 'bridal') this.model.bridalHeroImage = '';
    else if (kind === 'accessory') this.model.accessoryHeroImage = '';
    else if (kind === 'consultation') this.model.consultationImage = '';
    else if (kind === 'category' && key) this.model.categoryImages = { ...this.model.categoryImages, [key]: '' };
    else if (key) this.model.subcategoryImages = { ...this.model.subcategoryImages, [key]: '' };
  }

  addMemory(): void {
    const memories = [...(this.model.memories ?? [])];
    memories.push({
      id: `memory-${Date.now()}`, name: '', quote: '', venue: '',
      image: '', span: 'square', active: true
    });
    this.model.memories = memories;
  }

  removeMemory(index: number): void {
    this.model.memories = (this.model.memories ?? []).filter((_, i) => i !== index);
  }

  publishMemory(index: number, active: boolean): void {
    const memory = this.model.memories?.[index];
    if (!memory) return;
    if (active && (!memory.image || !memory.name.trim() || !memory.quote.trim())) {
      this.error = 'برای انتشار خاطره، عکس، نام و متن خاطره را کامل کنید.';
      return;
    }
    memory.active = active;
    this.saving = true;
    this.error = '';
    this.message = '';
    this.api.save({ memories: this.model.memories }).pipe(
      finalize(() => { this.saving = false; this.cdr.markForCheck(); }),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: value => {
        this.model = {
          ...this.model,
          ...value,
          categoryImages: { ...(value.categoryImages ?? this.model.categoryImages ?? {}) },
          subcategoryImages: { ...(value.subcategoryImages ?? this.model.subcategoryImages ?? {}) }
        };
        this.api.appearance.set(value);
        this.message = active
          ? 'خاطره منتشر شد و در بخش خاطرات صفحه اصلی نمایش داده می‌شود.'
          : 'خاطره از صفحه اصلی برداشته شد و در پنل باقی ماند.';
      },
      error: err => {
        memory.active = !active;
        this.error = err?.error?.message || 'تغییر وضعیت انتشار خاطره انجام نشد.';
      }
    });
  }

  chooseMemory(event: Event, memory: SiteMemory): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file || !file.type.startsWith('image/') || file.size > 8 * 1024 * 1024) return;
    const reader = new FileReader();
    reader.onload = () => { memory.image = String(reader.result || ''); this.cdr.markForCheck(); };
    reader.readAsDataURL(file);
  }

  save(): void {
    this.saving = true; this.error = ''; this.message = '';
    this.api.save({
      bridalHeroImage: this.model.bridalHeroImage,
      accessoryHeroImage: this.model.accessoryHeroImage,
      consultationImage: this.model.consultationImage,
      categoryImages: this.model.categoryImages,
      subcategoryImages: this.model.subcategoryImages,
      memories: this.model.memories
    }).pipe(finalize(() => { this.saving = false; this.cdr.markForCheck(); }), takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: value => { this.model = value; this.api.appearance.set(value); this.message = 'تنظیمات ظاهری سایت ذخیره شد.'; },
        error: err => { this.error = err?.error?.message || 'ذخیره تنظیمات انجام نشد.'; }
      });
  }
}

function moveInOrder(order: string[], slug: string, direction: -1 | 1): void {
  const index = order.indexOf(slug);
  const target = index + direction;
  if (index < 0 || target < 0 || target >= order.length) return;
  [order[index], order[target]] = [order[target], order[index]];
}
