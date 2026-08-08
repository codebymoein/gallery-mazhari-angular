import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  ViewChild
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { CATALOG_CATEGORIES } from '@shared/data/catalog-categories';
import { assetUrl, onImgErrorUseFallback } from '@shared/utils/asset-url';

interface DiscoveryCategory {
  title: string;
  parentTitle: string;
  image: string;
  link: string[];
}

@Component({
  selector: 'app-subcategory-carousel',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './subcategory-carousel.component.html',
  styleUrls: ['./subcategory-carousel.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SubcategoryCarouselComponent {
  @ViewChild('track') private track?: ElementRef<HTMLElement>;

  readonly items: DiscoveryCategory[] = this.stableDiscoveryOrder(
    CATALOG_CATEGORIES.flatMap(category => {
      if (!category.subcategories.length) {
        return [{
          title: category.title,
          parentTitle: 'دسته‌بندی اصلی',
          image: assetUrl(category.image),
          link: ['/shop', category.slug]
        }];
      }

      return category.subcategories.map(subcategory => ({
        title: subcategory.label,
        parentTitle: category.title,
        image: assetUrl(subcategory.image || category.image),
        link: ['/shop', category.slug, subcategory.slug]
      }));
    })
  );

  scroll(direction: -1 | 1): void {
    const element = this.track?.nativeElement;
    if (!element) return;
    element.scrollBy({
      left: direction * Math.min(element.clientWidth * 0.82, 720),
      behavior: 'smooth'
    });
  }

  hideBrokenImage(event: Event): void {
    onImgErrorUseFallback(event);
  }

  private stableDiscoveryOrder<T extends DiscoveryCategory>(values: T[]): T[] {
    return [...values].sort((left, right) =>
      this.stableHash(`${left.parentTitle}/${left.title}`) -
      this.stableHash(`${right.parentTitle}/${right.title}`)
    );
  }

  private stableHash(value: string): number {
    let hash = 2166136261;
    for (let index = 0; index < value.length; index++) {
      hash ^= value.charCodeAt(index);
      hash = Math.imul(hash, 16777619);
    }
    return hash >>> 0;
  }
}
