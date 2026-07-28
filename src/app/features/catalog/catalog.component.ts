import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import {
  formatIrr,
  mockPriceForProduct,
  SearchCategoryHit,
  SearchProductHit,
  SearchService,
  SmartSearchResult
} from '@core/services/search.service';
import {
  BRIDAL_COLLECTION_CATEGORIES,
  BridalCollectionCategory,
  BridalSampleProduct,
  productsForCategory
} from '@shared/data/bridal-collection-categories';
import {
  findCategoryForSubSlug,
  getCatalogCategoryBySlug
} from '@shared/data/catalog-categories';

const BRIDAL_SLUGS = new Set(BRIDAL_COLLECTION_CATEGORIES.map(c => c.slug));
const COLLECTION_SLUGS = new Set([
  'bridal-clothing',
  'arabic-bridal-dresses',
  'european-bridal-dresses',
  'mermaid-bridal-dresses',
  'engagement-dresses'
]);

@Component({
  selector: 'app-catalog',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './catalog.component.html',
  styleUrls: ['./catalog.component.css']
})
export class CatalogComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly searchService = inject(SearchService);
  private querySub?: Subscription;
  private readonly collectionSlugs = COLLECTION_SLUGS;

  readonly categories = BRIDAL_COLLECTION_CATEGORIES;
  readonly heroImage = 'assets/images/home-hero-bride.webp';

  isBridalView = true;
  activeSlug = 'bridal-clothing';
  activeCategory: BridalCollectionCategory = this.categories[0];
  activeTitle = 'فروشگاه محصولات';
  products: BridalSampleProduct[] = productsForCategory('bridal-clothing');
  collectionRails: Array<{ category: BridalCollectionCategory; products: BridalSampleProduct[] }> = [];

  searchQuery = '';
  searchResult: SmartSearchResult | null = null;

  ngOnInit(): void {
    this.querySub = this.route.queryParamMap.subscribe(params => {
      const searchTerm = params.get('s')?.trim() ?? '';

      if (searchTerm) {
        this.searchQuery = searchTerm;
        this.searchResult = this.searchService.search(searchTerm);
        window.scrollTo({ top: 0, behavior: 'auto' });
        return;
      }

      this.searchQuery = '';
      this.searchResult = null;

      const slug = params.get('category') ?? 'bridal-clothing';
      this.activeSlug = slug;
      this.isBridalView = BRIDAL_SLUGS.has(slug);
      this.activeCategory = this.categories.find(c => c.slug === slug) ?? this.categories[0];

      const catalogCat = getCatalogCategoryBySlug(slug);
      const subMatch = findCategoryForSubSlug(slug);
      this.activeTitle =
        catalogCat?.title ??
        subMatch?.sub.label ??
        this.activeCategory.title ??
        'فروشگاه محصولات';

      this.products = productsForCategory(slug);
      this.collectionRails = this.categories
        .filter(c => c.slug !== 'bridal-clothing')
        .map(category => ({
          category,
          products: this.shuffleProducts(productsForCategory(category.slug)).slice(0, 8)
        }));
      window.scrollTo({ top: 0, behavior: 'auto' });
    });
  }

  isSearchMode(): boolean {
    return !!this.searchQuery && !!this.searchResult;
  }

  categoryLink(slug: string): string[] {
    if (this.collectionSlugs.has(slug)) {
      return ['/collections', slug];
    }
    const parent = getCatalogCategoryBySlug(slug);
    if (parent) {
      return ['/shop', parent.slug];
    }
    const found = findCategoryForSubSlug(slug);
    if (found) {
      return ['/shop', found.category.slug, found.sub.slug];
    }
    return ['/catalog'];
  }

  categoryQueryParams(slug: string): { category: string } | null {
    if (this.collectionSlugs.has(slug)) {
      return null;
    }
    if (getCatalogCategoryBySlug(slug) || findCategoryForSubSlug(slug)) {
      return null;
    }
    return { category: slug };
  }

  categoryChipLink(cat: SearchCategoryHit): string[] {
    if (this.collectionSlugs.has(cat.slug)) {
      return ['/collections', cat.slug];
    }
    const parent = getCatalogCategoryBySlug(cat.slug);
    if (parent) {
      return ['/shop', parent.slug];
    }
    const found = findCategoryForSubSlug(cat.slug);
    if (found) {
      return ['/shop', found.category.slug, found.sub.slug];
    }
    return ['/catalog'];
  }

  categoryChipQueryParams(cat: SearchCategoryHit): { category: string } | null {
    if (this.collectionSlugs.has(cat.slug)) {
      return null;
    }
    if (getCatalogCategoryBySlug(cat.slug) || findCategoryForSubSlug(cat.slug)) {
      return null;
    }
    return { category: cat.slug };
  }

  formatPrice(product: SearchProductHit): string {
    return formatIrr(product.price);
  }

  productPrice(product: BridalSampleProduct): string {
    return formatIrr(mockPriceForProduct(product.id));
  }

  hideBrokenImage(event: Event): void {
    (event.currentTarget as HTMLImageElement).hidden = true;
  }

  isActive(cat: BridalCollectionCategory): boolean {
    return cat.slug === this.activeSlug;
  }

  private shuffleProducts(products: BridalSampleProduct[]): BridalSampleProduct[] {
    const copy = [...products];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  ngOnDestroy(): void {
    this.querySub?.unsubscribe();
  }
}
