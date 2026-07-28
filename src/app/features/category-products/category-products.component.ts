import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import {
  formatIrr,
  mockPriceForProduct
} from '@core/services/search.service';
import { ShoppingContextService } from '@core/services/shopping-context.service';
import {
  BridalSampleProduct,
  productsForCategory
} from '@shared/data/bridal-collection-categories';
import {
  CatalogCategory,
  CatalogSubcategory,
  getCatalogCategoryBySlug,
  getSubcategory
} from '@shared/data/catalog-categories';

@Component({
  selector: 'app-category-products',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './category-products.component.html',
  styleUrls: ['./category-products.component.css']
})
export class CategoryProductsComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly shoppingContext = inject(ShoppingContextService);
  private sub?: Subscription;

  parentSlug = '';
  subSlug = '';
  category: CatalogCategory | null = null;
  subcategory: CatalogSubcategory | null = null;
  products: BridalSampleProduct[] = [];

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
      this.products = productsForCategory(subSlug);
      this.shoppingContext.rememberPath(['/shop', slug, subSlug]);
      window.scrollTo({ top: 0, behavior: 'auto' });
    });
  }

  priceLabel(product: BridalSampleProduct): string {
    return formatIrr(mockPriceForProduct(product.id));
  }

  hideBrokenImage(event: Event): void {
    (event.currentTarget as HTMLImageElement).hidden = true;
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }
}
