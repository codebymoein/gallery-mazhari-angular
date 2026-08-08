import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { Component, OnDestroy, OnInit, PLATFORM_ID, effect, inject } from '@angular/core';

import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import {
  CatalogCategory,
  CatalogSubcategory,
  getCatalogCategoryBySlug
} from '@shared/data/catalog-categories';
import { ShoppingContextService } from '@core/services/shopping-context.service';
import { SeoService } from '@core/services/seo.service';
import { assetUrl, onImgErrorUseFallback } from '@shared/utils/asset-url';
import { AppearanceApiService } from '@core/services/appearance-api.service';

type CardShape = 'tall' | 'wide' | 'square' | 'feature';

@Component({
  selector: 'app-category-hub',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './category-hub.component.html',
  styleUrls: ['./category-hub.component.css']
})
export class CategoryHubComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly shoppingContext = inject(ShoppingContextService);
  private readonly appearanceApi = inject(AppearanceApiService);
  private readonly seo = inject(SeoService);
  private readonly document = inject(DOCUMENT);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private sub?: Subscription;

  category: CatalogCategory | null = null;
  parentSlug = '';
  readonly onImgError = onImgErrorUseFallback;

  get customRequestType(): 'veil' | 'dress' | null {
    if (this.parentSlug === 'bridal-veils') return 'veil';
    if (this.parentSlug === 'bridal-clothing') return 'dress';
    return null;
  }

  private readonly shapes: CardShape[] = [
    'feature', 'tall', 'square', 'wide', 'tall', 'square', 'feature', 'square'
  ];

  constructor() {
    effect(() => {
      this.appearanceApi.appearance();
      if (this.parentSlug) this.setCategory(this.parentSlug);
    });
    this.appearanceApi.load();
  }

  ngOnInit(): void {
    this.sub = this.route.paramMap.subscribe((params) => {
      const slug = params.get('slug') ?? '';
      this.parentSlug = slug;
      const found = getCatalogCategoryBySlug(slug);

      if (!found) {
        void this.router.navigate(['/catalog']);
        return;
      }
      if (found.subcategories.length === 0) {
        void this.router.navigate(['/catalog'], {
          queryParams: { category: found.slug },
          replaceUrl: true
        });
        return;
      }

      this.setCategory(slug);
      this.applyCategorySeo(found);
      this.shoppingContext.rememberPath(['/shop', found.slug]);
      this.scrollToTop();
    });
  }

  private setCategory(slug: string): void {
    const found = getCatalogCategoryBySlug(slug);
    if (!found) return;
    const appearance = this.appearanceApi.appearance();
    const categoryImage = appearance?.categoryImages?.[found.slug] || assetUrl(found.image);
    this.category = {
      ...found,
      image: categoryImage,
      subcategories: found.subcategories.map(sub => ({
        ...sub,
        image: appearance?.subcategoryImages?.[sub.slug] || assetUrl(sub.image || found.image)
      }))
    };
  }

  private applyCategorySeo(category: CatalogCategory): void {
    const image = this.category?.image || category.image;
    this.seo.applyCollectionSeo({
      title: `${category.title} | گالری مظهری`,
      description: `مشاهده مجموعه ${category.title} و زیرگروه‌های منتخب عروس در گالری مظهری.`,
      canonicalPath: `/shop/${category.slug}`,
      image,
      imageAlt: category.title
    });
  }

  private scrollToTop(): void {
    if (!this.isBrowser) return;
    this.document.defaultView?.scrollTo({ top: 0, behavior: 'auto' });
  }

  cardShape(index: number): CardShape {
    return this.shapes[index % this.shapes.length];
  }

  trackSub(_index: number, sub: CatalogSubcategory): string {
    return sub.slug;
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }
}
