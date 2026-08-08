import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { Component, HostListener, OnDestroy, OnInit, PLATFORM_ID, inject } from '@angular/core';

import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import {
  formatIrr,
} from '@core/services/search.service';
import { ShoppingContextService } from '@core/services/shopping-context.service';
import { SeoService } from '@core/services/seo.service';
import {
  BridalSampleProduct,
  getSizeOptionsForProduct,
  isFootwearCategory,
  isConsultationCategory,
  productsForCategory
} from '@shared/data/bridal-collection-categories';
import {
  CatalogCategory,
  CatalogSubcategory,
  getCatalogCategoryBySlug,
  getSubcategory
} from '@shared/data/catalog-categories';
import { ResponsiveProductImageDirective } from '@shared/directives/responsive-product-image.directive';

@Component({
  selector: 'app-category-products',
  standalone: true,
  imports: [RouterLink, ResponsiveProductImageDirective],
  templateUrl: './category-products.component.html',
  styleUrls: ['./category-products.component.css']
})
export class CategoryProductsComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly shoppingContext = inject(ShoppingContextService);
  private readonly seo = inject(SeoService);
  private readonly document = inject(DOCUMENT);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private sub?: Subscription;

  parentSlug = '';
  subSlug = '';
  category: CatalogCategory | null = null;
  subcategory: CatalogSubcategory | null = null;
  products: BridalSampleProduct[] = [];
  allProducts: BridalSampleProduct[] = [];
  availableSizes: string[] = [];
  selectedSize = '';
  visibleCount = 20;

  ngOnInit(): void {
    this.sub = this.route.paramMap.subscribe(params => {
      const slug = params.get('slug') ?? '';
      const subSlug = params.get('subSlug') ?? '';
      this.parentSlug = slug;
      this.subSlug = subSlug;

      const cat = getCatalogCategoryBySlug(slug);
      const sub = getSubcategory(slug, subSlug);

      if (!cat || !sub) {
        void this.router.navigate(['/catalog']);
        return;
      }

      this.category = cat;
      this.subcategory = sub;
      this.allProducts = productsForCategory(subSlug);
      this.products = this.allProducts;
      this.availableSizes = isFootwearCategory(subSlug)
        ? Array.from(new Set(
            this.allProducts.flatMap(product =>
              getSizeOptionsForProduct(product)
                .filter(option => option.available && option.stock > 0)
                .map(option => option.size)
            )
          )).sort((a, b) => a.localeCompare(b, 'fa', { numeric: true }))
        : [];
      this.selectedSize = '';
      this.resetVisibleProducts();
      this.applyCategorySeo(cat, sub);
      this.shoppingContext.rememberPath(['/shop', slug, subSlug]);
      this.scrollToTop();
    });
  }

  priceLabel(product: BridalSampleProduct): string {
    return product.price != null && product.price > 0
      ? formatIrr(product.price)
      : 'قیمت ثبت نشده';
  }

  showCommerce(product: BridalSampleProduct): boolean {
    return !isConsultationCategory(product.categorySlug);
  }

  filterBySize(size: string): void {
    this.selectedSize = size;
    this.products = !size
      ? this.allProducts
      : this.allProducts.filter(product =>
          getSizeOptionsForProduct(product).some(
            option => option.size === size && option.available && option.stock > 0
          )
        );
    this.resetVisibleProducts();
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
    if (!this.isBrowser || this.visibleCount >= this.products.length) return;
    const view = this.document.defaultView;
    if (!view) return;
    const remaining = this.document.documentElement.scrollHeight - (view.scrollY + view.innerHeight);
    if (remaining < view.innerHeight * 1.5) {
      this.visibleCount = Math.min(this.products.length, this.visibleCount + this.rowsPerBatch());
    }
  }

  hideBrokenImage(event: Event): void {
    (event.currentTarget as HTMLImageElement).hidden = true;
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  private applyCategorySeo(category: CatalogCategory, subcategory: CatalogSubcategory): void {
    this.seo.applyCollectionSeo({
      title: `${subcategory.label} | ${category.title} | گالری مظهری`,
      description: `مشاهده محصولات ${subcategory.label} از مجموعه ${category.title} در گالری مظهری.`,
      canonicalPath: `/shop/${category.slug}/${subcategory.slug}`,
      image: subcategory.image || category.image,
      imageAlt: subcategory.label
    });
  }

  private resetVisibleProducts(): void {
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
}
