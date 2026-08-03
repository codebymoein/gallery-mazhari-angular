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

  readonly items: DiscoveryCategory[] = this.shuffle(
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

  private shuffle<T>(values: T[]): T[] {
    const result = [...values];
    for (let index = result.length - 1; index > 0; index--) {
      const randomIndex = Math.floor(Math.random() * (index + 1));
      [result[index], result[randomIndex]] = [result[randomIndex], result[index]];
    }
    return result;
  }
}
