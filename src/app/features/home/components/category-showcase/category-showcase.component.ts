import { Component, computed, ChangeDetectionStrategy, inject } from '@angular/core';

import { RouterLink } from '@angular/router';
import {
  CATALOG_CATEGORIES,
  CatalogCategory
} from '@shared/data/catalog-categories';
import { AppearanceApiService } from '@core/services/appearance-api.service';
import { assetUrl } from '@shared/utils/asset-url';

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

  hideBrokenImage(event: Event): void {
    (event.currentTarget as HTMLImageElement).hidden = true;
  }
}
