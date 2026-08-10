import { Component, computed, ChangeDetectionStrategy, inject } from '@angular/core';

import { RouterLink } from '@angular/router';
import {
  CATALOG_CATEGORIES,
  CatalogCategory
} from '@shared/data/catalog-categories';
import { AppearanceApiService } from '@core/services/appearance-api.service';
import { assetUrl, onImgErrorUseFallback } from '@shared/utils/asset-url';

@Component({
  selector: 'app-category-showcase',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './category-showcase.component.html',
  styleUrls: ['./category-showcase.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CategoryShowcaseComponent {
  private readonly appearanceApi = inject(AppearanceApiService);
  readonly categories = computed<CatalogCategory[]>(() => {
    const overrides = this.appearanceApi.appearance()?.categoryImages ?? {};
    return CATALOG_CATEGORIES.map(category => ({
      ...category,
      image: overrides[category.slug] || assetUrl(category.image)
    }));
  });

  readonly largeCards  = computed(() => this.categories().filter(c => c.span === 'large'));
  readonly mediumCards = computed(() => this.categories().filter(c => c.span === 'medium'));
  readonly smallCards  = computed(() => this.categories().filter(c => c.span === 'small'));

  constructor() {
    this.appearanceApi.load();
  }

  hideBrokenImage(event: Event, category: CatalogCategory): void {
    const image = event.target as HTMLImageElement;
    const bundledImage = CATALOG_CATEGORIES.find(item => item.slug === category.slug)?.image;
    const bundledUrl = assetUrl(bundledImage);

    if (bundledUrl && image.dataset['bundledFallbackApplied'] !== '1' && !image.src.includes(bundledUrl)) {
      image.dataset['bundledFallbackApplied'] = '1';
      image.src = bundledUrl;
      return;
    }

    onImgErrorUseFallback(event);
  }
}
