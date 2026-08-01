import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, ElementRef, ViewChild, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { DiscountsApiService } from '@core/services/discounts-api.service';
import { BackendProduct } from '@core/services/products-api.service';
import { interval } from 'rxjs';
import { ResponsiveProductImageDirective } from '@shared/directives/responsive-product-image.directive';

@Component({
  selector: 'app-discount-showcase',
  standalone: true,
  imports: [CommonModule, RouterLink, ResponsiveProductImageDirective],
  templateUrl: './discount-showcase.component.html',
  styleUrls: ['./discount-showcase.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DiscountShowcaseComponent {
  private readonly api = inject(DiscountsApiService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);
  @ViewChild('rail') rail?: ElementRef<HTMLElement>;

  products: BackendProduct[] = [];
  loading = true;
  now = Date.now();

  constructor() {
    this.api.getProducts(true).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: products => { this.products = products; this.loading = false; this.cdr.markForCheck(); },
      error: () => { this.loading = false; this.cdr.markForCheck(); }
    });
    interval(1000).pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.now = Date.now();
      this.cdr.markForCheck();
    });
  }

  scroll(direction: number): void {
    this.rail?.nativeElement.scrollBy({ left: direction * -340, behavior: 'smooth' });
  }

  image(product: BackendProduct): string {
    return product.photos?.[0]?.url || '/assets/images/product-placeholder.webp';
  }

  remaining(product: BackendProduct): { days: number; hours: number; minutes: number; seconds: number } | null {
    if (!product.discountEndsAt) return null;
    const value = Math.max(0, new Date(product.discountEndsAt).getTime() - this.now);
    return {
      days: Math.floor(value / 86400000),
      hours: Math.floor((value % 86400000) / 3600000),
      minutes: Math.floor((value % 3600000) / 60000),
      seconds: Math.floor((value % 60000) / 1000)
    };
  }
}
