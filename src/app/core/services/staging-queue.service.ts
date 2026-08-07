import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '@env/environment';
import { AdminActivityService } from '@core/services/admin-activity.service';
import { AdminAuthService } from '@core/services/admin-auth.service';
import {
  ProductsApiService,
  backendProductToStaging
} from '@core/services/products-api.service';
import { PublishedCatalogSyncService } from '@core/services/published-catalog-sync.service';
import { CATALOG_CATEGORIES } from '@shared/data/catalog-categories';
import {
  MAX_STAGING_PHOTOS,
  ManagerMetrics,
  NEW_PRODUCT_CATEGORY_LABEL,
  NEW_PRODUCT_CATEGORY_SLUG,
  StagingPhoto,
  StagingProduct,
  StagingStatus
} from '@shared/models/staging-product.model';

function withPrimaryPhoto(item: StagingProduct): StagingProduct {
  const photos = item.photos || [];
  return {
    ...item,
    photos,
    photoUrl: photos[0]?.url,
    photoFileName: photos[0]?.fileName
  };
}

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * صف انتشار محصولات.
 * منبع اصلی داده: API بک‌اند (Postgres) — با ورود ادمین، صف از سرور خوانده
 * می‌شود و همه عملیات اول روی سرور اعمال می‌شوند تا روی همه دستگاه‌ها یکسان
 * باشد. اگر سرور در دسترس نباشد، همان رفتار محلی (localStorage) حفظ می‌شود.
 */
@Injectable({ providedIn: 'root' })
export class StagingQueueService {
  private readonly storageKey = environment.storageKeys.stagingQueue;
  private readonly activity = inject(AdminActivityService);
  private readonly auth = inject(AdminAuthService);
  private readonly api = inject(ProductsApiService);
  private readonly publishedSync = inject(PublishedCatalogSyncService);

  private readonly itemsSignal = signal<StagingProduct[]>(this.load());

  /** آخرین وضعیت اتصال به سرور — برای نمایش/عیب‌یابی */
  readonly serverSynced = signal(false);
  /** Conflict آخرین ویرایش catalog؛ برای جلوگیری از پیام موفقیت کاذب در UI. */
  readonly catalogConflict = signal(false);

  readonly items = this.itemsSignal.asReadonly();
  readonly maxPhotos = MAX_STAGING_PHOTOS;

  constructor() {
    // مهاجرت قوانین عملیاتی روی داده‌های قدیمی localStorage نیز اعمال می‌شود؛
    // بنابراین انتقال دسته‌ها وابسته به آپلود مجدد فایل نیست.
    this.persist();
    // با ورود ادمین (یا وجود نشست قبلی) صف از سرور بارگیری می‌شود.
    effect(() => {
      if (this.auth.isAuthenticated()) {
        void this.refreshFromServer();
      }
    });
  }

  readonly pendingItems = computed(() =>
    this.itemsSignal().filter(
      (i) => i.status === 'waiting_photo' || i.status === 'ready_for_approval'
    )
  );

  readonly waitingPhoto = computed(() =>
    this.itemsSignal().filter((i) => i.status === 'waiting_photo')
  );

  readonly readyForApproval = computed(() =>
    this.itemsSignal().filter((i) => i.status === 'ready_for_approval')
  );

  readonly published = computed(() =>
    this.itemsSignal().filter((i) => i.status === 'published')
  );

  readonly rejected = computed(() =>
    this.itemsSignal().filter((i) => i.status === 'rejected')
  );

  readonly awaitingStock = computed(() =>
    this.itemsSignal().filter((i) => i.status === 'awaiting_stock')
  );

  readonly categoryGroups = computed(() => {
    const pending = this.pendingItems();
    const counts = new Map<string, { label: string; slug: string; count: number }>();

    counts.set(NEW_PRODUCT_CATEGORY_SLUG, {
      label: NEW_PRODUCT_CATEGORY_LABEL,
      slug: NEW_PRODUCT_CATEGORY_SLUG,
      count: pending.filter(item => item.isNewImport).length
    });
    counts.set('unconventional', {
      label: 'طبقات نامتعارف',
      slug: 'unconventional',
      count: 0
    });
    for (const cat of CATALOG_CATEGORIES) {
      counts.set(cat.slug, { label: cat.title, slug: cat.slug, count: 0 });
    }

    for (const item of pending) {
      const key = !item.parentCategorySlug || item.parentCategorySlug === NEW_PRODUCT_CATEGORY_SLUG
        ? 'unconventional'
        : item.parentCategorySlug;
      const current = counts.get(key) || {
        label: item.parentCategory || 'طبقات نامتعارف',
        slug: key,
        count: 0
      };
      current.count += 1;
      counts.set(key, current);
    }

    // وضعیت‌های عملیاتی در انتهای نوار: انتظار موجودی، سپس زباله‌دان.
    counts.set('awaiting-stock', {
      label: 'کالاهای در انتظار موجودی',
      slug: 'awaiting-stock',
      count: this.awaitingStock().length
    });
    counts.set('trash', {
      label: 'زباله‌دان',
      slug: 'trash',
      count: this.rejected().length
    });

    // همه دسته‌های اصلی سایت + وضعیت‌های عملیاتی انتهای نوار
    return [...counts.values()];
  });

  async updateCatalog(
    id: string,
    catalog: {
      category: string;
      categorySlug: string;
      parentCategory: string;
      parentCategorySlug: string;
      collection?: string;
      hiddenTags?: string[];
      modelSelectionEnabled?: boolean;
    }
  ): Promise<boolean> {
    this.catalogConflict.set(false);
    try {
      if (this.hasServerSession() && UUID_PATTERN.test(id)) {
        const saved = await firstValueFrom(this.api.updateCatalog(id, catalog));
        const next = withPrimaryPhoto(backendProductToStaging(saved));
        this.itemsSignal.update(items => items.map(item => item.id === id ? next : item));
      } else {
        this.itemsSignal.update(items =>
          items.map(item => item.id === id ? {
            ...item,
            ...catalog,
            isNewImport: catalog.parentCategorySlug === NEW_PRODUCT_CATEGORY_SLUG
              ? item.isNewImport
              : false
          } : item)
        );
      }
      this.persist();
      return true;
    } catch (err) {
      this.catalogConflict.set(err instanceof HttpErrorResponse && err.status === 409);
      return false;
    }
  }

  async restoreBackup(products: StagingProduct[]): Promise<number> {
    if (this.hasServerSession()) {
      const result = await firstValueFrom(this.api.restoreProducts(products));
      this.itemsSignal.set(collapseDuplicateProducts(
        result.queue.map(item => withPrimaryPhoto(backendProductToStaging(item)))
      ));
      this.persist();
      this.publishedSync.refresh();
      return result.restored;
    }
    this.itemsSignal.set(collapseDuplicateProducts(products.map(withPrimaryPhoto)));
    this.persist();
    return products.length;
  }

  readonly metrics = computed((): ManagerMetrics => {
    const items = this.itemsSignal();
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const dayMs = startOfDay.getTime();

    const processedToday = items.filter((i) => {
      const stamp = i.publishedAt || i.processedAt;
      return !!stamp && new Date(stamp).getTime() >= dayMs;
    }).length;

    return {
      totalPending: items.filter(
        (i) => i.status === 'waiting_photo' || i.status === 'ready_for_approval'
      ).length,
      waitingPhoto: items.filter((i) => i.status === 'waiting_photo').length,
      readyForApproval: items.filter((i) => i.status === 'ready_for_approval').length,
      processedToday,
      activeOnSite: items.filter((i) => i.status === 'published').length
    };
  });

  /** بارگیری مجدد صف از سرور (در صورت وجود نشست ادمین با توکن) */
  async refreshFromServer(): Promise<boolean> {
    if (!this.hasServerSession()) {
      return false;
    }
    try {
      const queue = await firstValueFrom(this.api.getQueue());
      // While authenticated, the server is authoritative even when its queue
      // is empty. Never resurrect a deliberately cleared server catalog from
      // stale browser localStorage.
      this.itemsSignal.set(collapseDuplicateProducts(
        queue.map((p) => withPrimaryPhoto(backendProductToStaging(p)))
      ));
      this.persist();
      this.serverSynced.set(true);
      return true;
    } catch (err) {
      console.warn('StagingQueue: server sync failed — using local data', err);
      this.serverSynced.set(false);
      return false;
    }
  }

  /**
   * اعمال نتیجه اکسل: افزودن موجودی‌دارها + حذف کامل ناموجودها از چرخه.
   * اول روی سرور؛ اگر سرور نبود، محلی.
   */
  async applyExcelImport(
    products: StagingProduct[],
    removedOutOfStock: string[],
    meta?: { fileName?: string }
  ): Promise<{ added: number; removed: number }> {
    if (this.auth.isAuthenticated() && !this.hasServerSession()) {
      throw new Error('نشست امن سرور کامل نیست. از پنل خارج شوید و دوباره وارد شوید.');
    }
    if (this.hasServerSession()) {
      try {
        const res = await firstValueFrom(
          this.api.applyImport({
            products: products.map((p) => ({
              code: p.code,
              name: p.name,
              category: p.category,
              parentCategory: p.parentCategory,
              parentCategorySlug: p.parentCategorySlug,
              categorySlug: p.categorySlug,
              stock: p.stock,
              status: p.status,
              price: p.price,
              isNewImport: p.isNewImport,
              size: p.size,
              material: p.material,
              heelHeight: p.heelHeight,
              platformHeight: p.platformHeight,
              variantKey: p.variantKey,
              variations: p.variations
            })),
            removedOutOfStock,
            fileName: meta?.fileName
          })
        );
        this.itemsSignal.set(collapseDuplicateProducts(
          res.queue.map((p) => withPrimaryPhoto(backendProductToStaging(p)))
        ));
        this.persist();
        this.serverSynced.set(true);
        this.publishedSync.refresh();
        this.logImport(res.added, res.removed, meta?.fileName);
        return { added: res.added, removed: res.removed };
      } catch (err) {
        this.serverSynced.set(false);
        const rejection = this.asServerRejection(err);
        throw new Error(rejection || 'ثبت فایل موجودی روی سرور انجام نشد. اتصال بک‌اند و نشست مدیر را بررسی کنید.');
      }
    }
    return this.applyExcelImportLocal(products, removedOutOfStock, meta);
  }

  async attachPhotos(
    id: string,
    newPhotos: Array<{ url: string; fileName: string }>,
    processedBy: string
  ): Promise<{ ok: boolean; total: number; message: string }> {
    if (this.canUseServerFor(id)) {
      try {
        const res = await firstValueFrom(
          this.api.attachPhotos(id, newPhotos, processedBy)
        );
        const updated = withPrimaryPhoto(backendProductToStaging(res));
        this.replaceItem(updated);
        this.logPhotoAttach(updated, processedBy);
        return {
          ok: true,
          total: updated.photos.length,
          message: `${newPhotos.length} عکس افزوده شد (${updated.photos.length}/${MAX_STAGING_PHOTOS}).`
        };
      } catch (err) {
        const rejection = this.asServerRejection(err);
        if (rejection) {
          const current = this.getById(id);
          return { ok: false, total: current?.photos?.length ?? 0, message: rejection };
        }
        console.warn('StagingQueue: server photo attach failed — local fallback', err);
      }
    }
    return this.attachPhotosLocal(id, newPhotos, processedBy);
  }

  /** سازگاری با کد قبلی تک‌عکسی */
  async attachPhoto(
    id: string,
    photoUrl: string,
    photoFileName: string,
    processedBy: string
  ): Promise<boolean> {
    const result = await this.attachPhotos(
      id,
      [{ url: photoUrl, fileName: photoFileName }],
      processedBy
    );
    return result.ok;
  }

  async removePhoto(id: string, index: number): Promise<boolean> {
    if (this.canUseServerFor(id)) {
      try {
        const res = await firstValueFrom(this.api.removePhoto(id, index));
        this.replaceItem(withPrimaryPhoto(backendProductToStaging(res)));
        return true;
      } catch (err) {
        if (this.asServerRejection(err)) {
          return false;
        }
        console.warn('StagingQueue: server photo remove failed — local fallback', err);
      }
    }
    return this.removePhotoLocal(id, index);
  }

  async setPrimaryPhoto(id: string, index: number): Promise<boolean> {
    if (this.canUseServerFor(id)) {
      try {
        const res = await firstValueFrom(this.api.setPrimaryPhoto(id, index));
        this.replaceItem(withPrimaryPhoto(backendProductToStaging(res)));
        this.publishedSync.refresh();
        return true;
      } catch (err) {
        if (this.asServerRejection(err)) return false;
        console.warn('StagingQueue: setting primary photo failed — local fallback', err);
      }
    }
    let changed = false;
    this.itemsSignal.update(items => items.map(item => {
      if (item.id !== id || index < 0 || index >= (item.photos || []).length) return item;
      const photos = [...item.photos];
      const [primary] = photos.splice(index, 1);
      changed = true;
      return withPrimaryPhoto({ ...item, photos: [primary, ...photos] });
    }));
    if (changed) this.persist();
    return changed;
  }

  async publish(id: string, publishedBy: string): Promise<boolean> {
    if (this.canUseServerFor(id)) {
      try {
        const res = await firstValueFrom(this.api.publish(id, publishedBy));
        const updated = withPrimaryPhoto(backendProductToStaging(res));
        this.replaceItem(updated);
        this.publishedSync.refresh();
        this.logPublish(updated, publishedBy);
        return true;
      } catch (err) {
        if (this.asServerRejection(err)) {
          return false;
        }
        console.warn('StagingQueue: server publish failed — local fallback', err);
      }
    }
    return this.publishLocal(id, publishedBy);
  }

  async unpublish(id: string, actor: string): Promise<boolean> {
    if (this.canUseServerFor(id)) {
      try {
        const res = await firstValueFrom(this.api.unpublish(id, actor));
        this.replaceItem(withPrimaryPhoto(backendProductToStaging(res)));
        this.publishedSync.refresh();
        return true;
      } catch (err) {
        if (this.asServerRejection(err)) return false;
        console.warn('StagingQueue: server unpublish failed — local fallback', err);
      }
    }
    return this.unpublishLocal(id, actor);
  }

  async overrideStatus(id: string, status: StagingStatus, actor: string): Promise<boolean> {
    if (this.canUseServerFor(id)) {
      try {
        const res = await firstValueFrom(this.api.overrideStatus(id, status, actor));
        this.replaceItem(withPrimaryPhoto(backendProductToStaging(res)));
        this.publishedSync.refresh();
        return true;
      } catch (err) {
        if (this.asServerRejection(err)) return false;
        console.warn('StagingQueue: server status override failed — local fallback', err);
      }
    }
    return this.overrideStatusLocal(id, status, actor);
  }

  getById(id: string): StagingProduct | undefined {
    return this.itemsSignal().find((item) => item.id === id);
  }

  getByIdentity(identity: string): StagingProduct | undefined {
    return this.itemsSignal().find(
      (item) => item.id === identity || item.code === identity
    );
  }

  private replaceItem(updated: StagingProduct): void {
    this.itemsSignal.update(items => items.map(item => item.id === updated.id ? updated : item));
    this.persist();
  }

  private canUseServerFor(id: string): boolean {
    return this.hasServerSession() && UUID_PATTERN.test(id);
  }

  private hasServerSession(): boolean {
    return Boolean(this.auth.user()?.accessToken);
  }

  private asServerRejection(err: unknown): string | null {
    if (!(err instanceof HttpErrorResponse)) return null;
    const response = err.error as { message?: unknown } | null;
    const message = response?.message;
    if (Array.isArray(message)) {
      return message.map(String).join('، ');
    }
    return typeof message === 'string' ? message : null;
  }

  private persist(): void {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.itemsSignal()));
    } catch (err) {
      console.warn('StagingQueue: persist failed', err);
    }
  }

  private load(): StagingProduct[] {
    try {
      const raw = localStorage.getItem(this.storageKey);
      if (!raw) return [];
      const parsed = JSON.parse(raw) as StagingProduct[];
      return Array.isArray(parsed) ? collapseDuplicateProducts(parsed) : [];
    } catch {
      return [];
    }
  }

  private applyExcelImportLocal(
    products: StagingProduct[],
    removedOutOfStock: string[],
    meta?: { fileName?: string }
  ): { added: number; removed: number } {
    const existing = this.itemsSignal();
    const existingByCode = new Map(existing.map((item) => [item.code.toUpperCase(), item]));
    const incomingCodes = new Set(products.map((item) => item.code.toUpperCase()));
    const removed = new Set(removedOutOfStock.map(code => code.toUpperCase()));
    const now = new Date().toISOString();
    let added = 0;
    let removedCount = 0;
    const next: StagingProduct[] = [];

    for (const item of existing) {
      const code = item.code.toUpperCase();
      if (item.status === 'rejected') {
        next.push(item);
        continue;
      }
      if (removed.has(code) || (!incomingCodes.has(code) && item.status === 'published')) {
        removedCount += 1;
        next.push({
          ...item,
          stock: 0,
          status: 'awaiting_stock',
          inventoryResumeStatus: item.status === 'awaiting_stock'
            ? item.inventoryResumeStatus
            : item.status
        });
        continue;
      }
      next.push(item);
    }

    for (const incoming of products) {
      if (incoming.stock <= 0) continue;
      const code = incoming.code.toUpperCase();
      const current = existingByCode.get(code);
      if (current?.status === 'rejected') continue;
      const idx = next.findIndex(item => item.code.toUpperCase() === code);
      if (idx >= 0) {
        const previous = next[idx];
        next[idx] = withPrimaryPhoto({
          ...previous,
          name: incoming.name,
          stock: incoming.stock,
          price: incoming.price ?? previous.price,
          size: incoming.size ?? previous.size,
          material: incoming.material ?? previous.material,
          isNewImport: previous.isNewImport,
          status: previous.status === 'awaiting_stock'
            ? previous.inventoryResumeStatus || 'waiting_photo'
            : previous.status,
          inventoryResumeStatus: undefined,
          importedAt: now
        });
      } else {
        next.push(withPrimaryPhoto({
          ...incoming,
          id: incoming.id || `local-${Date.now()}-${Math.random()}`,
          isNewImport: true,
          status: 'waiting_photo',
          importedAt: now,
          photos: incoming.photos || []
        }));
        added += 1;
      }
    }

    this.itemsSignal.set(collapseDuplicateProducts(next));
    this.persist();
    this.publishedSync.refresh();
    this.logImport(added, removedCount, meta?.fileName);
    return { added, removed: removedCount };
  }

  private attachPhotosLocal(
    id: string,
    newPhotos: Array<{ url: string; fileName: string }>,
    processedBy: string
  ): { ok: boolean; total: number; message: string } {
    const item = this.getById(id);
    if (!item) return { ok: false, total: 0, message: 'محصول پیدا نشد.' };
    const existing = item.photos || [];
    if (existing.length + newPhotos.length > MAX_STAGING_PHOTOS) {
      return {
        ok: false,
        total: existing.length,
        message: `حداکثر ${MAX_STAGING_PHOTOS} عکس برای هر محصول مجاز است.`
      };
    }
    const now = new Date().toISOString();
    const photos: StagingPhoto[] = [
      ...existing,
      ...newPhotos.map(photo => ({ ...photo, addedAt: now }))
    ];
    const updated = withPrimaryPhoto({
      ...item,
      photos,
      processedAt: now,
      processedBy,
      status: photos.length ? 'ready_for_approval' : item.status
    });
    this.replaceItem(updated);
    return { ok: true, total: photos.length, message: 'عکس‌ها ذخیره شدند.' };
  }

  private removePhotoLocal(id: string, index: number): boolean {
    const item = this.getById(id);
    if (!item || index < 0 || index >= (item.photos || []).length) return false;
    const photos = item.photos.filter((_, i) => i !== index);
    this.replaceItem(withPrimaryPhoto({ ...item, photos }));
    return true;
  }

  private publishLocal(id: string, publishedBy: string): boolean {
    const item = this.getById(id);
    if (!item || item.status !== 'ready_for_approval' || !(item.photos || []).length) return false;
    this.replaceItem({
      ...item,
      status: 'published',
      publishedAt: new Date().toISOString(),
      publishedBy
    });
    this.publishedSync.refresh();
    return true;
  }

  private unpublishLocal(id: string, actor: string): boolean {
    const item = this.getById(id);
    if (!item || item.status !== 'published') return false;
    this.replaceItem({
      ...item,
      status: 'ready_for_approval',
      processedBy: actor,
      publishedAt: undefined,
      publishedBy: undefined
    });
    this.publishedSync.refresh();
    return true;
  }

  private overrideStatusLocal(id: string, status: StagingStatus, actor: string): boolean {
    const item = this.getById(id);
    if (!item) return false;
    if (item.status === 'published' || status === 'published' || status === 'awaiting_stock') return false;
    const trashedFromStatus = status === 'rejected'
      ? item.status
      : item.status === 'rejected'
        ? undefined
        : item.trashedFromStatus;
    this.replaceItem({
      ...item,
      status,
      trashedFromStatus,
      processedAt: new Date().toISOString(),
      processedBy: actor
    });
    return true;
  }

  private logPhotoAttach(item: StagingProduct, actor: string): void {
    this.activity.log({
      type: 'photo_attached',
      title: 'عکس محصول ثبت شد',
      description: `${item.name} (${item.code}) توسط ${actor}`,
      productId: item.id,
      productCode: item.code,
      actor
    });
  }

  private logPublish(item: StagingProduct, actor: string): void {
    this.activity.log({
      type: 'product_published',
      title: 'محصول روی سایت منتشر شد',
      description: `${item.name} (${item.code}) توسط ${actor}`,
      productId: item.id,
      productCode: item.code,
      actor
    });
  }

  private logImport(added: number, removed: number, fileName?: string): void {
    this.activity.log({
      type: 'inventory_import',
      title: 'فایل انبار اعمال شد',
      description: `${fileName || 'فایل اکسل'} — ${added} محصول جدید، ${removed} محصول ناموجود`,
      actor: this.auth.user()?.username
    });
  }
}

function collapseDuplicateProducts(items: StagingProduct[]): StagingProduct[] {
  const byCode = new Map<string, StagingProduct>();
  for (const item of items) {
    const code = item.code?.trim().toUpperCase();
    if (!code) continue;
    const current = byCode.get(code);
    if (!current) {
      byCode.set(code, item);
      continue;
    }
    const currentPhotos = current.photos?.length || 0;
    const nextPhotos = item.photos?.length || 0;
    const currentRank = statusRank(current.status);
    const nextRank = statusRank(item.status);
    if (nextPhotos > currentPhotos || (nextPhotos === currentPhotos && nextRank > currentRank)) {
      byCode.set(code, item);
    }
  }
  return [...byCode.values()];
}

function statusRank(status: StagingStatus): number {
  if (status === 'published') return 5;
  if (status === 'ready_for_approval') return 4;
  if (status === 'waiting_photo') return 3;
  if (status === 'awaiting_stock') return 2;
  return 1;
}
