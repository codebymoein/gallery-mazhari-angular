import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { Component, HostListener, OnDestroy, OnInit, PLATFORM_ID, effect, inject } from '@angular/core';

import { ActivatedRoute, RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { SeoService } from '@core/services/seo.service';
import { ShoppingContextService } from '@core/services/shopping-context.service';
import { PublishedCatalogSyncService } from '@core/services/published-catalog-sync.service';
import {
  BRIDAL_COLLECTION_CATEGORIES,
  BridalCollectionCategory,
  BridalSampleProduct,
  productsForCategory
} from '@shared/data/bridal-collection-categories';
import { StorefrontProductCardComponent } from '@shared/components/storefront-product-card/storefront-product-card.component';

@Component({
  selector: 'app-collection-page',
  standalone: true,
  imports: [RouterLink, StorefrontProductCardComponent],
  templateUrl: './collection-page.component.html',
  styleUrls: ['./collection-page.component.css']
})
export class CollectionPageComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly shoppingContext = inject(ShoppingContextService);
  private readonly seo = inject(SeoService);
  private readonly publishedSync = inject(PublishedCatalogSyncService);
  private readonly document = inject(DOCUMENT);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private sub?: Subscription;

  readonly collections = BRIDAL_COLLECTION_CATEGORIES;

  activeCollection: BridalCollectionCategory = this.collections[0];
  products: BridalSampleProduct[] = [];
  isAllDresses = false;
  visibleCount = 20;

  constructor() {
    effect(() => {
      if (!this.publishedSync.version()) return;
      this.refreshProducts();
    });
  }

  ngOnInit(): void {
    this.sub = this.route.paramMap.subscribe(params => {
      const slug = params.get('slug') ?? this.collections[0].slug;
      this.activeCollection = this.collections.find(c => c.slug === slug) ?? this.collections[0];
      this.isAllDresses = this.activeCollection.slug === 'bridal-clothing';
      this.refreshProducts();
      this.applyCollectionSeo();
      this.shoppingContext.rememberPath(['/collections', this.activeCollection.slug]);
      this.scrollToTop();
    });
  }

  isActive(slug: string): boolean { return this.activeCollection.slug === slug; }
  get visibleProducts(): BridalSampleProduct[] { return this.products.slice(0, this.visibleCount); }

  galleryImages(product: BridalSampleProduct): string[] {
    const images = (product.gallery?.length ? product.gallery : [product.image]).filter(Boolean);
    return Array.from(new Set(images)).slice(0, 5);
  }

  trackByProductId(_index: number, product: BridalSampleProduct): string { return product.id; }

  @HostListener('window:scroll')
  loadMoreNearBottom(): void {
    if (!this.isBrowser || this.visibleCount >= this.products.length) return;
    const view = this.document.defaultView;
    if (!view) return;
    const remaining = this.document.documentElement.scrollHeight - (view.scrollY + view.innerHeight);
    if (remaining < view.innerHeight * 1.5) {
      this.visibleCount = Math.min(this.products.length, this.visibleCount + this.rowsPerBatch());
    }
  }

  private applyCollectionSeo(): void {
    const collection = this.activeCollection;
    this.seo.applyCollectionSeo({
      title: `${collection.title} | گالری مظهری`,
      description: `مشاهده ${collection.title} و مدل‌های منتخب لباس عروس در گالری مظهری.`,
      canonicalPath: `/collections/${collection.slug}`,
      image: collection.image,
      imageAlt: collection.title
    });
  }

  private refreshProducts(): void {
    this.products = productsForCategory(this.activeCollection.slug);
    this.visibleCount = Math.min(this.products.length, this.rowsPerBatch());
  }

  private rowsPerBatch(): number {
    if (!this.isBrowser) return 40;
    const width = this.document.defaultView?.innerWidth ?? 1024;
    const columns = width >= 1024 ? 4 : width >= 640 ? 3 : 2;
    return columns * 10;
  }

  private scrollToTop(): void {
    if (!this.isBrowser) return;
    this.document.defaultView?.scrollTo({ top: 0, behavior: 'auto' });
  }

  ngOnDestroy(): void { this.sub?.unsubscribe(); }
}
