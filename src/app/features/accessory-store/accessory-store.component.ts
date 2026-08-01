import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';

import { RouterLink } from '@angular/router';
import {
  ACCESSORY_STORE_CATEGORIES,
  CatalogCategory
} from '@shared/data/catalog-categories';
import { AppearanceApiService } from '@core/services/appearance-api.service';
import { assetUrl, onImgErrorUseFallback } from '@shared/utils/asset-url';

type MosaicShape = 'hero' | 'tall' | 'wide' | 'compact';

@Component({
  selector: 'app-accessory-store',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './accessory-store.component.html',
  styleUrls: ['./accessory-store.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AccessoryStoreComponent {
  private readonly appearanceApi = inject(AppearanceApiService);
  readonly onImgError = onImgErrorUseFallback;
  private readonly shapes: MosaicShape[] = [
    'hero', 'tall', 'compact', 'wide', 'tall', 'compact', 'wide', 'hero'
  ];

  readonly categories = computed<CatalogCategory[]>(() => {
    const overrides = this.appearanceApi.appearance()?.categoryImages ?? {};
    return ACCESSORY_STORE_CATEGORIES.map(category => ({
      ...category,
      image: overrides[category.slug] || assetUrl(category.image)
    }));
  });

  constructor() {
    this.appearanceApi.load();
  }

  cardShape(index: number): MosaicShape {
    return this.shapes[index % this.shapes.length];
  }
}
