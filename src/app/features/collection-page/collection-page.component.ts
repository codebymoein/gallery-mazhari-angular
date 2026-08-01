import { Component, HostListener, OnDestroy, OnInit, inject } from '@angular/core';

import { ActivatedRoute, RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { ShoppingContextService } from '@core/services/shopping-context.service';
import {
  BRIDAL_COLLECTION_CATEGORIES,
  BridalCollectionCategory,
  BridalSampleProduct,
  productsForCategory
} from '@shared/data/bridal-collection-categories';

@Component({
  selector: 'app-collection-page',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './collection-page.component.html',
  styleUrls: ['./collection-page.component.css']
})
export class CollectionPageComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly shoppingContext = inject(ShoppingContextService);
  private sub?: Subscription;

  readonly collections = BRIDAL_COLLECTION_CATEGORIES;

  activeCollection: BridalCollectionCategory = this.collections[0];
  products: BridalSampleProduct[] = [];
  isAllDresses = false;
  visibleCount = 20;

  ngOnInit(): void {
    this.sub = this.route.paramMap.subscribe(params => {
      const slug = params.get('slug') ?? this.collections[0].slug;
      this.activeCollection = this.collections.find(c => c.slug === slug) ?? this.collections[0];
      this.isAllDresses = this.activeCollection.slug === 'bridal-clothing';
      this.products = productsForCategory(this.activeCollection.slug);
      this.visibleCount = Math.min(this.products.length, this.rowsPerBatch());
      this.shoppingContext.rememberPath(['/collections', this.activeCollection.slug]);
      window.scrollTo({ top: 0, behavior: 'auto' });
    });
  }

  isActive(slug: string): boolean {
    return this.activeCollection.slug === slug;
  }

  hideBrokenImage(event: Event): void {
    (event.currentTarget as HTMLImageElement).hidden = true;
  }

  get visibleProducts(): BridalSampleProduct[] {
    return this.products.slice(0, this.visibleCount);
  }

  galleryImages(product: BridalSampleProduct): string[] {
    const images = (product.gallery?.length ? product.gallery : [product.image]).filter(Boolean);
    return Array.from(new Set(images)).slice(0, 5);
  }

  trackByProductId(_index: number, product: BridalSampleProduct): string {
    return product.id;
  }

  @HostListener('window:scroll')
  loadMoreNearBottom(): void {
    if (this.visibleCount >= this.products.length) return;
    const remaining = document.documentElement.scrollHeight - (window.scrollY + window.innerHeight);
    if (remaining < window.innerHeight * 1.5) {
      this.visibleCount = Math.min(this.products.length, this.visibleCount + this.rowsPerBatch());
    }
  }

  private rowsPerBatch(): number {
    const columns = window.innerWidth >= 1024 ? 4 : window.innerWidth >= 640 ? 3 : 2;
    return columns * 10;
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }
}
