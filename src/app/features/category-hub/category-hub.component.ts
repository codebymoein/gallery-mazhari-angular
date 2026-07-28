import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import {
  CatalogCategory,
  CatalogSubcategory,
  getCatalogCategoryBySlug
} from '@shared/data/catalog-categories';
import { ShoppingContextService } from '@core/services/shopping-context.service';
import { assetUrl, onImgErrorUseFallback } from '@shared/utils/asset-url';

type CardShape = 'tall' | 'wide' | 'square' | 'feature';

@Component({
  selector: 'app-category-hub',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './category-hub.component.html',
  styleUrls: ['./category-hub.component.css']
})
export class CategoryHubComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly shoppingContext = inject(ShoppingContextService);
  private sub?: Subscription;

  category: CatalogCategory | null = null;
  parentSlug = '';
  readonly onImgError = onImgErrorUseFallback;

  private readonly shapes: CardShape[] = [
    'feature', 'tall', 'square', 'wide', 'tall', 'square', 'feature', 'square'
  ];

  ngOnInit(): void {
    this.sub = this.route.paramMap.subscribe((params) => {
      const slug = params.get('slug') ?? '';
      this.parentSlug = slug;
      const found = getCatalogCategoryBySlug(slug);

      if (!found) {
        void this.router.navigate(['/catalog']);
        return;
      }

      this.category = {
        ...found,
        image: assetUrl(found.image),
        subcategories: found.subcategories.map((s) => ({
          ...s,
          image: assetUrl(s.image || found.image)
        }))
      };
      this.shoppingContext.rememberPath(['/shop', found.slug]);
      window.scrollTo({ top: 0, behavior: 'auto' });
    });
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
