import { Component, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import {
  CATALOG_CATEGORIES,
  CatalogCategory
} from '@shared/data/catalog-categories';

@Component({
  selector: 'app-category-showcase',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './category-showcase.component.html',
  styleUrls: ['./category-showcase.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CategoryShowcaseComponent {
  readonly categories: CatalogCategory[] = CATALOG_CATEGORIES;

  readonly largeCards  = computed(() => this.categories.filter(c => c.span === 'large'));
  readonly mediumCards = computed(() => this.categories.filter(c => c.span === 'medium'));
  readonly smallCards  = computed(() => this.categories.filter(c => c.span === 'small'));

  hideBrokenImage(event: Event): void {
    (event.currentTarget as HTMLImageElement).hidden = true;
  }
}
