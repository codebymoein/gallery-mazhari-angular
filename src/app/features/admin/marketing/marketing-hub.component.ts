import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import {
  DiscountRule,
  DiscountRulePayload,
  DiscountScope,
  DiscountsApiService
} from '@core/services/discounts-api.service';
import { BackendProduct, ProductsApiService } from '@core/services/products-api.service';
import { CATALOG_CATEGORIES } from '@shared/data/catalog-categories';
import { finalize } from 'rxjs';

@Component({
  selector: 'app-marketing-hub',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './marketing-hub.component.html',
  styleUrls: ['./marketing-hub.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MarketingHubComponent {
  private readonly api = inject(DiscountsApiService);
  private readonly productsApi = inject(ProductsApiService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);

  readonly categories = CATALOG_CATEGORIES;
  rules: DiscountRule[] = [];
  products: BackendProduct[] = [];
  loading = true;
  saving = false;
  error = '';
  message = '';
  editingId: string | null = null;

  form: DiscountRulePayload = this.emptyForm();

  constructor() {
    this.reload();
    this.productsApi.getQueue()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({ next: products => { this.products = products; this.cdr.markForCheck(); } });
  }

  get targets(): Array<{ key: string; label: string }> {
    if (this.form.scopeType === 'category') {
      return this.categories.map(category => ({ key: category.slug, label: category.title }));
    }
    if (this.form.scopeType === 'subcategory') {
      return this.categories.flatMap(category => category.subcategories.map(sub => ({
        key: sub.slug,
        label: `${category.title} / ${sub.label}`
      })));
    }
    return this.products.map(product => ({
      key: product.id,
      label: `${product.name} — ${product.code}`
    }));
  }

  scopeChanged(): void {
    this.form.targetKey = '';
    this.form.targetLabel = '';
  }

  targetChanged(): void {
    this.form.targetLabel = this.targets.find(item => item.key === this.form.targetKey)?.label ?? '';
  }

  submit(): void {
    this.error = '';
    this.message = '';
    this.targetChanged();
    if (!this.form.title.trim() || !this.form.targetKey || this.form.percent < 1 || this.form.percent > 99) {
      this.error = 'عنوان، هدف تخفیف و درصد معتبر را کامل کنید.';
      return;
    }
    const payload: DiscountRulePayload = {
      ...this.form,
      title: this.form.title.trim(),
      subtitle: this.form.subtitle?.trim() || null,
      badgeText: this.form.badgeText?.trim() || null,
      startsAt: this.form.startsAt ? new Date(this.form.startsAt).toISOString() : null,
      endsAt: this.form.endsAt ? new Date(`${this.form.endsAt}T23:59:59`).toISOString() : null
    };
    this.saving = true;
    const request = this.editingId ? this.api.update(this.editingId, payload) : this.api.create(payload);
    request.pipe(finalize(() => { this.saving = false; this.cdr.markForCheck(); }), takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.message = this.editingId ? 'قانون تخفیف ویرایش شد.' : 'قانون تخفیف ساخته شد.';
          this.cancelEdit();
          this.reload();
        },
        error: err => { this.error = err?.error?.message || 'ذخیره تخفیف انجام نشد.'; }
      });
  }

  edit(rule: DiscountRule): void {
    this.editingId = rule.id;
    this.form = {
      title: rule.title,
      subtitle: rule.subtitle,
      scopeType: rule.scopeType,
      targetKey: rule.targetKey,
      targetLabel: rule.targetLabel,
      percent: rule.percent,
      badgeText: rule.badgeText,
      priority: rule.priority,
      active: rule.active,
      showOnHome: rule.showOnHome,
      startsAt: rule.startsAt?.slice(0, 10) || null,
      endsAt: rule.endsAt?.slice(0, 10) || null
    };
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  toggle(rule: DiscountRule): void {
    this.api.update(rule.id, this.rulePayload(rule, { active: !rule.active }))
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({ next: () => this.reload(), error: () => { this.error = 'تغییر وضعیت انجام نشد.'; this.cdr.markForCheck(); } });
  }

  remove(rule: DiscountRule): void {
    if (!window.confirm(`قانون «${rule.title}» حذف شود؟`)) return;
    this.api.remove(rule.id).pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({ next: () => { this.message = 'قانون تخفیف حذف شد.'; this.reload(); } });
  }

  cancelEdit(): void {
    this.editingId = null;
    this.form = this.emptyForm();
  }

  scopeLabel(scope: DiscountScope): string {
    return scope === 'category' ? 'دسته‌بندی' : scope === 'subcategory' ? 'زیرمجموعه' : 'محصول تکی';
  }

  private reload(): void {
    this.loading = true;
    this.api.getRules().pipe(finalize(() => { this.loading = false; this.cdr.markForCheck(); }), takeUntilDestroyed(this.destroyRef))
      .subscribe({ next: rules => { this.rules = rules; }, error: () => { this.error = 'دریافت تخفیف‌ها انجام نشد.'; } });
  }

  private rulePayload(rule: DiscountRule, patch: Partial<DiscountRulePayload> = {}): DiscountRulePayload {
    const { id: _id, createdAt: _createdAt, updatedAt: _updatedAt, ...payload } = rule;
    return { ...payload, ...patch };
  }

  private emptyForm(): DiscountRulePayload {
    return {
      title: '',
      subtitle: '',
      scopeType: 'category',
      targetKey: '',
      targetLabel: '',
      percent: 10,
      badgeText: 'فروش ویژه',
      priority: 0,
      active: true,
      showOnHome: true,
      startsAt: null,
      endsAt: null
    };
  }
}
