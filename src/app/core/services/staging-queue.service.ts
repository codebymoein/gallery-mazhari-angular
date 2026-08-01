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
import { tagExcelCategory } from '@shared/utils/excel-category-tagger';

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
    }
  ): Promise<boolean> {
    try {
      if (this.hasServerSession() && UUID_PATTERN.test(id)) {
        const saved = await firstValueFrom(this.api.updateCatalog(id, catalog));
        const next = withPrimaryPhoto(backendProductToStaging(saved));
        this.itemsSignal.update(items => items.map(item => item.id === id ? next : item));
      } else {
        this.itemsSignal.update(items =>
          items.map(item => item.id === id ? { ...item, ...catalog } : item)
        );
      }
      this.persist();
      return true;
    } catch {
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
      const localSnapshot = this.itemsSignal();
      const queue = await firstValueFrom(this.api.getQueue());
      // An empty server must not erase a valid browser queue. This happens
      // after a backend reset or when older imports only existed locally.
      // Restore that snapshot to the server once, then use the persisted
      // server response on all subsequent refreshes/devices.
      if (!queue.length && localSnapshot.length) {
        const restored = await firstValueFrom(this.api.restoreProducts(localSnapshot));
        this.itemsSignal.set(collapseDuplicateProducts(
          restored.queue.map((p) => withPrimaryPhoto(backendProductToStaging(p)))
        ));
      } else {
        this.itemsSignal.set(collapseDuplicateProducts(
          queue.map((p) => withPrimaryPhoto(backendProductToStaging(p)))
        ));
      }
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
        console.warn('StagingQueue: server import failed — applying locally', err);
        this.serverSynced.set(false);
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
        const updated = withPrimaryPhoto(backendProductToStaging(res));
        this.replaceItem(updated);
        this.publishedSync.refresh();
        this.logOverride(updated, actor);
        return true;
      } catch (err) {
        if (this.asServerRejection(err)) return false;
        console.warn('StagingQueue: server unpublish failed', err);
        return false;
      }
    }
    return this.overrideStatusLocal(id, 'ready_for_approval', actor);
  }

  async overrideStatus(
    id: string,
    status: StagingStatus,
    actor: string
  ): Promise<boolean> {
    if (this.canUseServerFor(id)) {
      try {
        const res = await firstValueFrom(this.api.overrideStatus(id, status, actor));
        const updated = withPrimaryPhoto(backendProductToStaging(res));
        this.replaceItem(updated);
        this.publishedSync.refresh();
        this.logOverride(updated, actor);
        return true;
      } catch (err) {
        if (this.asServerRejection(err)) {
          return false;
        }
        console.warn('StagingQueue: server status override failed — local fallback', err);
      }
    }
    return this.overrideStatusLocal(id, status, actor);
  }

  getById(id: string): StagingProduct | undefined {
    return this.itemsSignal().find((i) => i.id === id);
  }

  getByIdentity(idOrCode: string): StagingProduct | undefined {
    const key = idOrCode.trim().toUpperCase();
    return this.itemsSignal().find(
      (item) => item.id === idOrCode || item.code.trim().toUpperCase() === key
    );
  }

  // ------------------------------------------------------------------
  // منطق محلی (fallback بدون سرور) — همان رفتار قبلی localStorage
  // ------------------------------------------------------------------

  private applyExcelImportLocal(
    products: StagingProduct[],
    removedOutOfStock: string[],
    meta?: { fileName?: string }
  ): { added: number; removed: number } {
    const positiveCodes = new Set(products.map((p) => p.code.toUpperCase()));
    const removeSet = new Set(
      removedOutOfStock
        .map((c) => c.toUpperCase())
        .filter((code) => !positiveCodes.has(code))
    );
    let removed = 0;
    let added = 0;

    this.itemsSignal.update((list) => {
      const uniqueList = collapseDuplicateProducts(list);
      const kept = uniqueList.filter((item) => {
        if (removeSet.has(item.code.toUpperCase())) {
          if (item.status === 'published' || item.status === 'awaiting_stock') {
            return true;
          }
          if (item.status === 'rejected') {
            return true;
          }
          removed += 1;
          return false;
        }
        return true;
      });

      const existingCodes = new Set(kept.map((i) => i.code.toUpperCase()));
      const fresh = products
        .filter((p) => !existingCodes.has(p.code.toUpperCase()))
        .map((p) => withPrimaryPhoto({ ...p, photos: p.photos || [] }));
      added = fresh.length;

      const incoming = new Map(products.map((p) => [p.code.toUpperCase(), p]));
      const merged = kept.map((item) => {
        if (item.status === 'rejected') return item;
        const next = incoming.get(item.code.toUpperCase());
        if (!next) {
          return removeSet.has(item.code.toUpperCase()) &&
            (item.status === 'published' || item.status === 'awaiting_stock')
            ? withPrimaryPhoto({
                ...item,
                stock: 0,
                status: 'awaiting_stock',
                isNewImport: false
              })
            : item;
        }
        return withPrimaryPhoto(migrateOperationalCategory({
          ...item,
          name: next.name,
          stock: next.stock,
          category: next.category,
          parentCategory: next.parentCategory,
          parentCategorySlug: next.parentCategorySlug,
          categorySlug: next.categorySlug,
          variations: next.variations,
          isNewImport: next.isNewImport,
          status:
            next.status === 'rejected'
              ? 'rejected'
              : item.status === 'awaiting_stock' && next.stock > 0
                ? 'published'
                : item.status
        }));
      });

      return [...fresh, ...merged];
    });

    this.persist();
    this.logImport(added, removed, meta?.fileName);
    return { added, removed };
  }

  private attachPhotosLocal(
    id: string,
    newPhotos: Array<{ url: string; fileName: string }>,
    processedBy: string
  ): { ok: boolean; total: number; message: string } {
    let result = { ok: false, total: 0, message: 'محصول یافت نشد.' };

    this.itemsSignal.update((list) =>
      list.map((item) => {
        if (item.id !== id) return item;
        const existing = [...(item.photos || [])];
        const room = MAX_STAGING_PHOTOS - existing.length;
        if (room <= 0) {
          result = {
            ok: false,
            total: existing.length,
            message: `حداکثر ${MAX_STAGING_PHOTOS} عکس مجاز است.`
          };
          return item;
        }

        const slice = newPhotos.slice(0, room).map(
          (p): StagingPhoto => ({
            url: p.url,
            fileName: p.fileName,
            addedAt: new Date().toISOString()
          })
        );
        const photos = [...existing, ...slice];
        const updated = withPrimaryPhoto({
          ...item,
          photos,
          status: 'waiting_photo' as StagingStatus,
          processedAt: new Date().toISOString(),
          processedBy
        });
        result = {
          ok: true,
          total: photos.length,
          message: `${slice.length} عکس افزوده شد (${photos.length}/${MAX_STAGING_PHOTOS}).`
        };
        return updated;
      })
    );

    if (result.ok) {
      this.persist();
      const product = this.getById(id);
      if (product) {
        this.logPhotoAttach(product, processedBy);
      }
    }

    return result;
  }

  private removePhotoLocal(id: string, index: number): boolean {
    let ok = false;
    this.itemsSignal.update((list) =>
      list.map((item) => {
        if (item.id !== id) return item;
        const photos = [...(item.photos || [])];
        if (index < 0 || index >= photos.length) return item;
        photos.splice(index, 1);
        ok = true;
        return withPrimaryPhoto(migrateOperationalCategory({
          ...item,
          photos,
          status:
            photos.length === 0
              ? ('waiting_photo' as StagingStatus)
              : item.status
        }));
      })
    );
    if (ok) this.persist();
    return ok;
  }

  private publishLocal(id: string, publishedBy: string): boolean {
    let updated: StagingProduct | null = null;
    this.itemsSignal.update((list) =>
      list.map((item) => {
        if (item.id !== id || item.status !== 'ready_for_approval') return item;
        updated = {
          ...item,
          status: 'published' as StagingStatus,
          publishedAt: new Date().toISOString(),
          publishedBy
        };
        return updated;
      })
    );
    if (updated) {
      this.persist();
      this.logPublish(updated as StagingProduct, publishedBy);
    }
    return !!updated;
  }

  private overrideStatusLocal(
    id: string,
    status: StagingStatus,
    actor: string
  ): boolean {
    let updated: StagingProduct | null = null;
    this.itemsSignal.update((list) =>
      list.map((item) => {
        if (item.id !== id) return item;
        const next: StagingProduct = {
          ...item,
          status,
          trashedFromStatus:
            status === 'rejected' && item.status !== 'rejected'
              ? item.status
              : item.status === 'rejected' && status !== 'rejected'
                ? undefined
                : item.trashedFromStatus,
          notes: `وضعیت توسط ${actor} تغییر کرد`
        };
        if (status === 'published') {
          next.publishedAt = new Date().toISOString();
          next.publishedBy = actor;
        }
        if (status === 'ready_for_approval') {
          next.processedAt = new Date().toISOString();
          next.processedBy = actor;
        }
        updated = withPrimaryPhoto(next);
        return updated;
      })
    );
    if (updated) {
      this.persist();
      this.logOverride(updated as StagingProduct, actor);
    }
    return !!updated;
  }

  // ------------------------------------------------------------------
  // کمکی‌ها
  // ------------------------------------------------------------------

  private hasServerSession(): boolean {
    return this.auth.isAuthenticated();
  }

  /** فقط رکوردهایی که واقعاً از سرور آمده‌اند (id از نوع UUID) */
  private canUseServerFor(id: string): boolean {
    return this.hasServerSession() && UUID_PATTERN.test(id);
  }

  /** خطاهای اعتبارسنجی سرور (400/404) نباید باعث fallback محلی شوند */
  private asServerRejection(err: unknown): string | null {
    if (err instanceof HttpErrorResponse && (err.status === 400 || err.status === 404)) {
      const message = (err.error as { message?: string | string[] })?.message;
      if (Array.isArray(message)) return message.join('، ');
      return message || 'درخواست توسط سرور رد شد.';
    }
    return null;
  }

  private replaceItem(updated: StagingProduct): void {
    this.itemsSignal.update((list) =>
      list.map((item) => (item.id === updated.id ? updated : item))
    );
    this.persist();
  }

  private logImport(added: number, removed: number, fileName?: string): void {
    const user = this.auth.user();
    this.activity.log({
      action: 'import',
      actor: user?.username || 'system',
      actorRole: user?.role || 'staff',
      summary: `اکسل ${fileName || ''}: ${added} کالای جدید، ${removed} ناموجود حذف شد`
    });
  }

  private logPhotoAttach(product: StagingProduct, processedBy: string): void {
    const user = this.auth.user();
    this.activity.log({
      action: 'photo_attach',
      actor: processedBy,
      actorRole: user?.role || 'staff',
      summary: `عکس‌های محصول ${product.code} به‌روزرسانی شد`,
      entityCode: product.code
    });
  }

  private logPublish(product: StagingProduct, publishedBy: string): void {
    const user = this.auth.user();
    this.activity.log({
      action: 'publish',
      actor: publishedBy,
      actorRole: user?.role || 'manager',
      summary: `محصول «${product.name}» منتشر شد`,
      entityCode: product.code
    });
  }

  private logOverride(product: StagingProduct, actor: string): void {
    const user = this.auth.user();
    this.activity.log({
      action: 'status_override',
      actor,
      actorRole: user?.role || 'manager',
      summary: `وضعیت ${product.code} تغییر کرد`,
      entityCode: product.code
    });
  }

  private load(): StagingProduct[] {
    try {
      const raw = localStorage.getItem(this.storageKey);
      if (!raw) {
        return [];
      }
      const parsed = JSON.parse(raw) as StagingProduct[];
      if (!Array.isArray(parsed)) {
        return [];
      }
      // مهاجرت داده‌های قدیمی بدون photos / parentCategory
      return collapseDuplicateProducts(parsed.map((item) => {
        const photos =
          item.photos?.length
            ? item.photos
            : item.photoUrl
              ? [
                  {
                    url: item.photoUrl,
                    fileName: item.photoFileName || `${item.code}.jpg`,
                    addedAt: item.processedAt || item.importedAt
                  }
                ]
              : [];
        const tag = tagExcelCategory(item.category, !!item.isNewImport);
        return withPrimaryPhoto(migrateOperationalCategory({
          ...item,
          photos,
          stock: item.stock ?? 1,
          parentCategory:
            item.parentCategory ||
            (tag.matched ? tag.parentCategory : 'سایر'),
          parentCategorySlug:
            item.parentCategorySlug ||
            (tag.matched ? tag.parentCategorySlug : 'uncategorized'),
          categorySlug:
            item.categorySlug ||
            (tag.matched ? tag.categorySlug : 'uncategorized'),
          isNewImport: item.isNewImport
        }));
      }));
    } catch {
      return [];
    }
  }

  private persist(): void {
    this.write(this.itemsSignal());
  }

  private write(items: StagingProduct[]): void {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(items));
    } catch (err) {
      // سهمیه localStorage پر شده — بدون این هشدار، عکس‌ها بی‌صدا از دست می‌روند.
      console.warn('StagingQueue: persist failed (localStorage quota?)', err);
    }
  }
}

function migrateOperationalCategory(item: StagingProduct): StagingProduct {
  const rawCategory = (item.category || '')
    .trim()
    .replace(/ي/g, 'ی')
    .replace(/ك/g, 'ک')
    .replace(/\s*\/\s*/g, '/');

  if (
    rawCategory === 'تولیدی' ||
    rawCategory.startsWith('تولیدی/') ||
    rawCategory === 'خدمات' ||
    rawCategory.startsWith('خدمات/')
  ) {
    return {
      ...item,
      status: 'rejected',
      trashedFromStatus:
        item.status !== 'rejected' ? item.status : item.trashedFromStatus
    };
  }

  const shouldReclassify =
    rawCategory.startsWith('حاج بهروز') ||
    rawCategory.includes('لباس زیر') ||
    item.parentCategorySlug === NEW_PRODUCT_CATEGORY_SLUG ||
    item.parentCategorySlug === 'unconventional';
  if (!shouldReclassify) return item;

  const tag = tagExcelCategory(rawCategory, !!item.isNewImport);
  if (!tag.matched || tag.parentCategorySlug === 'unconventional') return item;
  return {
    ...item,
    category: tag.category,
    categorySlug: tag.categorySlug,
    parentCategory: tag.parentCategory,
    parentCategorySlug: tag.parentCategorySlug
  };
}

function collapseDuplicateProducts(items: StagingProduct[]): StagingProduct[] {
  const byCode = new Map<string, StagingProduct>();
  const statusRank: Record<StagingStatus, number> = {
    published: 5,
    awaiting_stock: 4,
    ready_for_approval: 3,
    waiting_photo: 2,
    rejected: 1
  };
  for (const item of items) {
    const key = item.code.trim().toUpperCase();
    const current = byCode.get(key);
    if (!current) {
      byCode.set(key, item);
      continue;
    }
    const preferred =
      statusRank[item.status] > statusRank[current.status] ||
      (item.photos?.length || 0) > (current.photos?.length || 0)
        ? item
        : current;
    const uniquePhotos = [...(current.photos || []), ...(item.photos || [])].filter(
      (photo, index, photos) =>
        photos.findIndex(candidate => candidate.url === photo.url) === index
    );
    byCode.set(key, withPrimaryPhoto({
      ...preferred,
      stock: Math.max(current.stock, item.stock),
      photos: uniquePhotos
    }));
  }
  return [...byCode.values()];
}
