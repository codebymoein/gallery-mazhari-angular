import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit,
  inject,
  signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Subscription, interval, switchMap, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import {
  MediaUploadResult,
  MediaZipGroup,
  MediaZipInspection,
  PlatformApiService
} from '@core/services/platform-api.service';
import { ProductsApiService } from '@core/services/products-api.service';
import { AdminInventoryService } from '@core/services/admin-inventory.service';
import { CATALOG_CATEGORIES } from '@shared/data/catalog-categories';
import { StagingProduct } from '@shared/models/staging-product.model';

type HubTab =
  | 'import'
  | 'media'
  | 'workflow'
  | 'rules'
  | 'tags'
  | 'looks'
  | 'jobs'
  | 'audit';

@Component({
  selector: 'app-platform-hub',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './platform-hub.component.html',
  styleUrls: ['./platform-hub.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PlatformHubComponent implements OnInit, OnDestroy {
  private readonly api = inject(PlatformApiService);
  private readonly productsApi = inject(ProductsApiService);
  private readonly inventory = inject(AdminInventoryService);
  private readonly cdr = inject(ChangeDetectorRef);
  private subs = new Subscription();

  readonly tab = signal<HubTab>('import');
  busy = false;
  error = '';
  message = '';

  dryRunReport: Record<string, unknown> | null = null;
  importId = '';
  mappingJson = '';
  confirmMapping = false;
  inventoryStrategy: 'preserve_inventory' | 'full_replace' | 'incremental' =
    'preserve_inventory';

  runs: unknown[] = [];
  orphans: unknown[] = [];
  quarantine: unknown[] = [];
  missingImages: unknown[] = [];
  mediaReport: Record<string, number | string> | null = null;
  inventorySummary: Record<string, number> | null = null;
  zipFile: File | null = null;
  zipInspection: MediaZipInspection | null = null;
  confirmedPublishedCodes = new Set<string>();
  uploadResult: MediaUploadResult | null = null;
  queue: unknown[] = [];
  selectedIds = new Set<string>();
  rejectReason = '';
  rules: unknown[] = [];
  simulateCode = '';
  simulation: Record<string, unknown> | null = null;
  pendingTags: unknown[] = [];
  looks: unknown[] = [];
  jobs: unknown[] = [];
  auditRows: unknown[] = [];
  analytics: Record<string, unknown> | null = null;

  ruleDraft = {
    name: 'پیشنهاد کفش برای لباس اروپایی',
    priority: 10,
    weight: 2,
    enabled: true,
    conditionsJson:
      '[{"field":"category","op":"contains","value":"لباس عروس"},{"field":"style","op":"eq","value":"European"}]',
    actionsJson:
      '[{"type":"recommend_category","value":"کفش"},{"type":"boost","value":"","weight":2}]'
  };

  lookDraft = {
    id: '',
    name: 'نگاه اروپایی باغ',
    slug: '',
    subtitle: '',
    story: 'ترکیب لباس اروپایی با اکسسوری‌های هماهنگ',
    style: 'European',
    mood: '',
    ceremony: 'Garden Wedding',
    productCodes: '',
    images: [] as string[],
    hotspots: [] as Array<{ imageIndex: number; productCode: string; x: number; y: number; label: string }>,
    status: 'draft',
    displayPriority: 0
  };
  hotspotProductCode = '';

  get publishedStyleProducts() {
    return this.inventory.items().filter(item =>
      item.status === 'active' || item.status === 'out_of_stock'
    );
  }

  ngOnInit(): void {
    this.refreshRuns();
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  setTab(t: HubTab): void {
    this.tab.set(t);
    this.error = '';
    this.message = '';
    if (t === 'media') this.refreshMedia();
    if (t === 'workflow') this.refreshQueue();
    if (t === 'rules') {
      this.refreshRules();
      this.refreshAnalytics();
    }
    if (t === 'tags') this.refreshTags();
    if (t === 'looks') this.refreshLooks();
    if (t === 'jobs') this.refreshJobs();
    if (t === 'audit') this.refreshAudit();
    this.cdr.markForCheck();
  }

  onExcelPick(ev: Event): void {
    const input = ev.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    this.runDryRun(file);
  }

  runDryRun(file: File): void {
    this.busy = true;
    this.error = '';
    this.message = '';
    this.dryRunReport = null;
    this.cdr.markForCheck();

    let mappingJson: string | undefined;
    if (this.mappingJson.trim()) {
      try {
        JSON.parse(this.mappingJson);
        mappingJson = this.mappingJson.trim();
      } catch {
        this.error = 'JSON نگاشت ستون‌ها نامعتبر است.';
        this.busy = false;
        this.cdr.markForCheck();
        return;
      }
    }

    this.subs.add(
      this.api
        .dryRun(file, {
          mappingJson,
          confirmUncertainMapping: this.confirmMapping,
          preserveInventory: this.inventoryStrategy === 'preserve_inventory'
        })
        .subscribe({
          next: (res) => {
            const r = res as { run?: { id?: string }; report?: Record<string, unknown> };
            this.importId = r.run?.id || '';
            this.dryRunReport = r.report || (res as Record<string, unknown>);
            this.message = 'Dry Run کامل شد — هیچ داده‌ای ثبت نشد.';
            this.busy = false;
            this.refreshRuns();
            this.cdr.markForCheck();
          },
          error: (err) => this.fail(err)
        })
    );
  }

  confirmImport(): void {
    if (!this.importId) {
      this.error = 'ابتدا Dry Run را اجرا کنید.';
      this.cdr.markForCheck();
      return;
    }
    if (this.dryRunReport && this.dryRunReport['canCommit'] === false) {
      this.error =
        'واردات مسدود است — ابتدا خطاهای مسدودکننده (کد/بارکد تکراری، فیلد نامعتبر) را برطرف کنید.';
      this.cdr.markForCheck();
      return;
    }
    this.busy = true;
    this.cdr.markForCheck();
    this.subs.add(
      this.api.confirmImport(this.importId, this.inventoryStrategy).subscribe({
        next: (res) => {
          const r = res as { job?: { id?: string } };
          this.message = `واردات در صف قرار گرفت${r.job?.id ? ` (job: ${r.job.id})` : ''}`;
          this.busy = false;
          this.pollJobs();
          this.cdr.markForCheck();
        },
        error: (err) => this.fail(err)
      })
    );
  }

  rollbackImport(): void {
    if (!this.importId) return;
    if (!confirm('بازگردانی کامل این واردات؟')) return;
    this.busy = true;
    this.subs.add(
      this.api.rollback(this.importId).subscribe({
        next: () => {
          this.message = 'Rollback انجام شد.';
          this.busy = false;
          this.cdr.markForCheck();
        },
        error: (err) => this.fail(err)
      })
    );
  }

  saveTemplate(): void {
    if (!this.dryRunReport) return;
    const mapping = (this.dryRunReport['mapping'] || {}) as Record<string, string>;
    const name = prompt('نام قالب نگاشت', 'Gallery Mazhari Accounting Export V1');
    if (!name) return;
    const fingerprint =
      (this.dryRunReport['fingerprint'] as string)?.slice(0, 64) ||
      Object.keys(mapping).sort().join('|');
    this.subs.add(
      this.api
        .saveTemplate({
          name,
          mapping,
          headerFingerprint: fingerprint
        })
        .subscribe({
          next: () => {
            this.message = 'قالب نگاشت ذخیره شد.';
            this.cdr.markForCheck();
          },
          error: (err) => this.fail(err)
        })
    );
  }

  onMediaPick(ev: Event): void {
    const input = ev.target as HTMLInputElement;
    const files = Array.from(input.files || []);
    input.value = '';
    if (!files.length) return;
    this.busy = true;
    this.subs.add(
      this.api.uploadMedia(files).subscribe({
        next: (res) => {
          const r = res as { attached?: number; orphans?: number; quarantined?: number };
          this.message = `رسانه: متصل ${r.attached ?? 0} | یتیم ${r.orphans ?? 0} | قرنطینه ${r.quarantined ?? 0}`;
          this.busy = false;
          this.refreshMedia();
          this.cdr.markForCheck();
        },
        error: (err) => this.fail(err)
      })
    );
  }

  onZipPick(ev: Event): void {
    const input = ev.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    this.zipFile = file;
    this.zipInspection = null;
    this.uploadResult = null;
    this.confirmedPublishedCodes.clear();
    this.busy = true;
    this.subs.add(
      this.api.inspectZip(file).pipe(
        switchMap((inspection) => {
          const missingCodes = new Set(
            inspection.groups
              .filter(group => group.match === 'missing')
              .map(group => this.normalizeCode(group.productCode))
          );
          const recoverable = this.inventory.items().filter(item =>
            missingCodes.has(this.normalizeCode(item.code))
          );
          if (!recoverable.length) return of(inspection);

          this.message = `${recoverable.length} محصول در صف محلی پیدا شد؛ در حال همگام‌سازی با سرور…`;
          this.cdr.markForCheck();
          return this.productsApi.restoreProducts(
            recoverable.map(item => this.inventoryItemToStaging(item))
          ).pipe(
            // Files may already have been uploaded before the local queue was
            // synchronised. Attach those existing orphan assets first so a
            // second upload is never required.
            switchMap(() => this.api.reattachOrphans()),
            switchMap(() => this.api.inspectZip(file))
          );
        })
      ).subscribe({
        next: (inspection) => {
          this.zipInspection = inspection;
          this.message = `${inspection.validImages} تصویر در ${inspection.groups.length} گروه شناسایی شد. نتیجه را بررسی و تأیید کنید.`;
          this.busy = false;
          this.cdr.markForCheck();
        },
        error: (err) => this.fail(err)
      })
    );
  }

  private inventoryItemToStaging(item: {
    id: string;
    code: string;
    name: string;
    category: string;
    parentCategorySlug?: string;
    categorySlug?: string;
    price: number;
    stock: number;
    photoUrl?: string;
  }): StagingProduct {
    const parent = CATALOG_CATEGORIES.find(category =>
      category.slug === item.parentCategorySlug ||
      category.subcategories.some(sub => sub.slug === item.categorySlug)
    );
    const photos = item.photoUrl ? [{
      url: item.photoUrl,
      fileName: `${item.code}.jpg`,
      addedAt: new Date().toISOString()
    }] : [];
    return {
      id: item.id,
      code: item.code.trim(),
      name: item.name,
      category: item.category,
      parentCategory: parent?.title || item.category,
      parentCategorySlug: parent?.slug || item.parentCategorySlug || 'unconventional',
      categorySlug: item.categorySlug || parent?.subcategories[0]?.slug || 'unconventional',
      stock: item.stock,
      price: item.price,
      isNewImport: true,
      status: 'waiting_photo',
      photos,
      photoUrl: photos[0]?.url,
      photoFileName: photos[0]?.fileName,
      importedAt: new Date().toISOString()
    };
  }

  private normalizeCode(value: string): string {
    return value
      .replace(/[۰-۹]/g, digit => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(digit)))
      .replace(/[٠-٩]/g, digit => String('٠١٢٣٤٥٦٧٨٩'.indexOf(digit)))
      .trim()
      .toUpperCase();
  }

  zipGroups(match: MediaZipGroup['match']): MediaZipGroup[] {
    return this.zipInspection?.groups.filter(group => group.match === match) || [];
  }

  togglePublishedConfirmation(code: string, checked: boolean): void {
    if (checked) {
      this.confirmedPublishedCodes.add(code);
    } else {
      this.confirmedPublishedCodes.delete(code);
    }
    this.cdr.markForCheck();
  }

  canCommitZip(): boolean {
    if (!this.zipFile || !this.zipInspection || this.busy) return false;
    return this.zipGroups('published').every(group =>
      this.confirmedPublishedCodes.has(group.productCode)
    );
  }

  commitZip(): void {
    if (!this.zipFile || !this.canCommitZip()) return;
    this.busy = true;
    this.error = '';
    this.uploadResult = null;
    this.subs.add(
      this.api.uploadZip(this.zipFile, [...this.confirmedPublishedCodes]).subscribe({
        next: (result) => {
          // A product can be restored between inspection and commit. Re-run
          // orphan attachment after every commit to close that race as well.
          this.api.reattachOrphans().subscribe({
            next: (reattached) => {
              const extra = (reattached as { attached?: number }).attached ?? 0;
              this.uploadResult = { ...result, attached: result.attached + extra, orphans: Math.max(0, result.orphans - extra) };
              this.message = `${result.attached + extra} تصویر متصل شد؛ ${Math.max(0, result.orphans - extra)} یتیم و ${result.quarantined} قرنطینه.`;
              this.busy = false;
              this.zipFile = null;
              this.refreshMedia();
              this.refreshQueue();
              this.cdr.markForCheck();
            },
            error: (err) => this.fail(err)
          });
        },
        error: (err) => this.fail(err)
      })
    );
  }

  resetZip(): void {
    this.zipFile = null;
    this.zipInspection = null;
    this.uploadResult = null;
    this.confirmedPublishedCodes.clear();
    this.message = '';
    this.error = '';
  }

  reattach(): void {
    this.subs.add(
      this.api.reattachOrphans().subscribe({
        next: (res) => {
          const r = res as { attached?: number };
          this.message = `${r.attached ?? 0} تصویر یتیم متصل شد.`;
          this.refreshMedia();
          this.cdr.markForCheck();
        },
        error: (err) => this.fail(err)
      })
    );
  }

  toggleSelect(id: string): void {
    if (this.selectedIds.has(id)) this.selectedIds.delete(id);
    else this.selectedIds.add(id);
    this.cdr.markForCheck();
  }

  approveSelected(publish: boolean): void {
    const ids = [...this.selectedIds];
    if (!ids.length) return;
    this.busy = true;
    this.subs.add(
      this.api.approve(ids, publish).subscribe({
        next: () => {
          this.message = publish ? 'تایید و انتشار انجام شد.' : 'تایید شد (منتشر نشد).';
          this.selectedIds.clear();
          this.busy = false;
          this.refreshQueue();
          this.cdr.markForCheck();
        },
        error: (err) => this.fail(err)
      })
    );
  }

  rejectSelected(): void {
    const ids = [...this.selectedIds];
    if (!ids.length) return;
    this.busy = true;
    this.subs.add(
      this.api.reject(ids, this.rejectReason || 'رد توسط مدیر').subscribe({
        next: () => {
          this.message = 'رد شد.';
          this.selectedIds.clear();
          this.busy = false;
          this.refreshQueue();
          this.cdr.markForCheck();
        },
        error: (err) => this.fail(err)
      })
    );
  }

  saveRule(): void {
    try {
      const conditions = JSON.parse(this.ruleDraft.conditionsJson);
      const actions = JSON.parse(this.ruleDraft.actionsJson);
      this.subs.add(
        this.api
          .saveRule({
            name: this.ruleDraft.name,
            priority: this.ruleDraft.priority,
            weight: this.ruleDraft.weight,
            enabled: this.ruleDraft.enabled,
            conditions,
            actions
          })
          .subscribe({
            next: (res) => {
              const r = res as { conflicts?: string[] };
              this.message =
                r.conflicts?.length
                  ? `قانون ذخیره شد با هشدار تعارض: ${r.conflicts.join(', ')}`
                  : 'قانون ذخیره شد.';
              this.refreshRules();
              this.cdr.markForCheck();
            },
            error: (err) => this.fail(err)
          })
      );
    } catch {
      this.error = 'JSON شرایط/اقدامات نامعتبر است.';
      this.cdr.markForCheck();
    }
  }

  runSimulate(): void {
    if (!this.simulateCode.trim()) return;
    this.subs.add(
      this.api.simulate(this.simulateCode.trim()).subscribe({
        next: (res) => {
          this.simulation = res as Record<string, unknown>;
          this.cdr.markForCheck();
        },
        error: (err) => this.fail(err)
      })
    );
  }

  approveTag(id: string): void {
    this.subs.add(
      this.api.approveTag(id).subscribe({
        next: () => {
          this.refreshTags();
          this.cdr.markForCheck();
        },
        error: (err) => this.fail(err)
      })
    );
  }

  saveLook(): void {
    const codes = this.lookDraft.productCodes
      .split(/[,\s]+/)
      .map((c) => c.trim())
      .filter(Boolean);
    this.subs.add(
      this.api
        .saveLook({
          id: this.lookDraft.id || undefined,
          name: this.lookDraft.name,
          slug: this.lookDraft.slug,
          subtitle: this.lookDraft.subtitle,
          story: this.lookDraft.story,
          style: this.lookDraft.style,
          mood: this.lookDraft.mood,
          ceremony: this.lookDraft.ceremony,
          productCodes: codes,
          images: this.lookDraft.images,
          hotspots: this.lookDraft.hotspots,
          coverImageUrl: this.lookDraft.images[0] || null,
          status: this.lookDraft.status,
          displayPriority: Number(this.lookDraft.displayPriority) || 0
        })
        .subscribe({
          next: () => {
            this.message = 'نگاه curated ذخیره شد (پیش‌نویس).';
            this.refreshLooks();
            this.cdr.markForCheck();
          },
          error: (err) => this.fail(err)
        })
    );
  }

  editLook(value: unknown): void {
    const look = this.asRecord(value);
    this.lookDraft = {
      id: String(look['id'] || ''),
      name: String(look['name'] || ''),
      slug: String(look['slug'] || ''),
      subtitle: String(look['subtitle'] || ''),
      story: String(look['story'] || ''),
      style: String(look['style'] || ''),
      mood: String(look['mood'] || ''),
      ceremony: String(look['ceremony'] || ''),
      productCodes: Array.isArray(look['productCodes']) ? (look['productCodes'] as string[]).join(', ') : '',
      images: Array.isArray(look['images']) ? [...look['images'] as string[]] : [],
      hotspots: Array.isArray(look['hotspots'])
        ? [...look['hotspots'] as Array<{ imageIndex: number; productCode: string; x: number; y: number; label: string }>]
        : [],
      status: String(look['status'] || 'draft'),
      displayPriority: Number(look['displayPriority'] || 0)
    };
  }

  chooseLookImages(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files ?? []).slice(0, 5 - this.lookDraft.images.length);
    for (const file of files) {
      if (!file.type.startsWith('image/') || file.size > 8 * 1024 * 1024) continue;
      const reader = new FileReader();
      reader.onload = () => {
        this.lookDraft.images = [...this.lookDraft.images, String(reader.result || '')].slice(0, 5);
        this.cdr.markForCheck();
      };
      reader.readAsDataURL(file);
    }
    input.value = '';
  }

  removeLookImage(index: number): void {
    this.lookDraft.images = this.lookDraft.images.filter((_, i) => i !== index);
    this.lookDraft.hotspots = this.lookDraft.hotspots
      .filter(item => item.imageIndex !== index)
      .map(item => ({ ...item, imageIndex: item.imageIndex > index ? item.imageIndex - 1 : item.imageIndex }));
  }

  toggleLookProduct(code: string, checked: boolean): void {
    const codes = new Set(this.lookDraft.productCodes.split(/[,\s]+/).filter(Boolean));
    if (checked) {
      codes.add(code);
    } else {
      codes.delete(code);
    }
    this.lookDraft.productCodes = [...codes].join(', ');
  }

  lookHasProduct(code: string): boolean {
    return this.lookDraft.productCodes.split(/[,\s]+/).includes(code);
  }

  startHotspot(code: string): void {
    this.hotspotProductCode = code;
    if (!this.lookHasProduct(code)) this.toggleLookProduct(code, true);
    this.message = 'حالا روی محل محصول در یکی از عکس‌های استایل کلیک کنید.';
  }

  placeHotspot(event: Event, imageIndex: number): void {
    if (!this.hotspotProductCode) return;
    const target = event.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();
    const clientX = event instanceof MouseEvent ? event.clientX : rect.left + rect.width / 2;
    const clientY = event instanceof MouseEvent ? event.clientY : rect.top + rect.height / 2;
    const product = this.publishedStyleProducts.find(item => item.code === this.hotspotProductCode);
    this.lookDraft.hotspots = [
      ...this.lookDraft.hotspots.filter(item =>
        !(item.imageIndex === imageIndex && item.productCode === this.hotspotProductCode)
      ),
      {
        imageIndex,
        productCode: this.hotspotProductCode,
        x: Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100)),
        y: Math.max(0, Math.min(100, ((clientY - rect.top) / rect.height) * 100)),
        label: product?.name || this.hotspotProductCode
      }
    ];
    this.hotspotProductCode = '';
    this.message = 'نقطه محصول روی عکس ثبت شد؛ برای نهایی‌شدن استایل را ذخیره کنید.';
  }

  removeHotspot(index: number): void {
    this.lookDraft.hotspots = this.lookDraft.hotspots.filter((_, i) => i !== index);
  }

  asRecord(v: unknown): Record<string, unknown> {
    return (v || {}) as Record<string, unknown>;
  }

  asArray(v: unknown): unknown[] {
    return Array.isArray(v) ? v : [];
  }

  idOf(v: unknown): string {
    return String(this.asRecord(v)['id'] ?? '');
  }

  private refreshRuns(): void {
    this.subs.add(
      this.api.listRuns().subscribe({
        next: (rows) => {
          this.runs = rows || [];
          this.cdr.markForCheck();
        },
        error: () => undefined
      })
    );
  }

  private refreshMedia(): void {
    this.subs.add(
      this.api.orphans().subscribe({
        next: (rows) => {
          this.orphans = rows || [];
          this.cdr.markForCheck();
        }
      })
    );
    this.subs.add(
      this.api.quarantine().subscribe({
        next: (rows) => {
          this.quarantine = rows || [];
          this.cdr.markForCheck();
        }
      })
    );
    this.subs.add(
      this.api.mediaMissing(100).subscribe({
        next: (rows) => {
          this.missingImages = rows || [];
          this.cdr.markForCheck();
        }
      })
    );
    this.subs.add(
      this.api.mediaReport().subscribe({
        next: (rows) => {
          this.mediaReport = rows || null;
          this.cdr.markForCheck();
        }
      })
    );
    this.subs.add(
      this.api.inventorySummary().subscribe({
        next: (rows) => {
          this.inventorySummary = rows || null;
          this.cdr.markForCheck();
        }
      })
    );
  }

  autoGenerateLooks(): void {
    this.busy = true;
    this.subs.add(
      this.api.autoGenerateCollections().subscribe({
        next: (res) => {
          const r = res as { created?: number; updated?: number };
          this.message = `کالکشن خودکار: ${r.created ?? 0} جدید، ${r.updated ?? 0} به‌روز (همه پیش‌نویس)`;
          this.busy = false;
          this.refreshLooks();
          this.cdr.markForCheck();
        },
        error: (err) => this.fail(err)
      })
    );
  }

  private refreshQueue(): void {
    this.subs.add(
      this.api.workflowQueue().subscribe({
        next: (rows) => {
          this.queue = rows || [];
          this.cdr.markForCheck();
        }
      })
    );
  }

  private refreshRules(): void {
    this.subs.add(
      this.api.listRules().subscribe({
        next: (rows) => {
          this.rules = rows || [];
          this.cdr.markForCheck();
        }
      })
    );
  }

  private refreshAnalytics(): void {
    this.subs.add(
      this.api.analytics().subscribe({
        next: (rows) => {
          this.analytics = rows as Record<string, unknown>;
          this.cdr.markForCheck();
        }
      })
    );
  }

  private refreshTags(): void {
    this.subs.add(
      this.api.pendingTags().subscribe({
        next: (rows) => {
          this.pendingTags = rows || [];
          this.cdr.markForCheck();
        }
      })
    );
  }

  private refreshLooks(): void {
    this.subs.add(
      this.api.listLooks().subscribe({
        next: (rows) => {
          this.looks = rows || [];
          this.cdr.markForCheck();
        }
      })
    );
  }

  private refreshJobs(): void {
    this.subs.add(
      this.api.jobs().subscribe({
        next: (rows) => {
          this.jobs = rows || [];
          this.cdr.markForCheck();
        }
      })
    );
  }

  private refreshAudit(): void {
    this.subs.add(
      this.api.audit().subscribe({
        next: (rows) => {
          this.auditRows = rows || [];
          this.cdr.markForCheck();
        }
      })
    );
  }

  private pollJobs(): void {
    this.subs.add(
      interval(2000)
        .pipe(
          switchMap(() => this.api.jobs().pipe(catchError(() => of([])))),
        )
        .subscribe((rows) => {
          this.jobs = rows || [];
          this.cdr.markForCheck();
        })
    );
  }

  private fail(err: unknown): void {
    const e = err as { error?: { message?: string | string[] }; message?: string };
    const msg = e?.error?.message || e?.message || 'خطای سرور';
    this.error = Array.isArray(msg) ? msg.join(', ') : String(msg);
    this.busy = false;
    this.cdr.markForCheck();
  }
}
