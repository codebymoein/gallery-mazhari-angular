import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { DiscountsApiService } from '@core/services/discounts-api.service';
import { BackendProduct } from '@core/services/products-api.service';

@Component({
  selector: 'app-discounts-page',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './discounts-page.component.html',
  styleUrls: ['./discounts-page.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DiscountsPageComponent {
  private readonly api = inject(DiscountsApiService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);
  products: BackendProduct[] = [];
  loading = true;
  selectedCategory = '';

  constructor() {
    this.api.getProducts().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: products => { this.products = products.filter(p => !!p.discountPercent); this.loading = false; this.cdr.markForCheck(); },
      error: () => { this.loading = false; this.cdr.markForCheck(); }
    });
  }

  get categories(): string[] {
    return [...new Set(this.products.map(product => product.parentCategory).filter(Boolean))];
  }
  get visible(): BackendProduct[] {
    return this.selectedCategory ? this.products.filter(p => p.parentCategory === this.selectedCategory) : this.products;
  }
  image(product: BackendProduct): string {
    return product.photos?.[0]?.url || '/assets/images/product-placeholder.webp';
  }
}
