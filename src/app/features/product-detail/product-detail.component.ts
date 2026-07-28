import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit,
  inject
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { CartService } from '@core/services/cart.service';
import { DreamCanvasService } from '@core/services/dream-canvas.service';
import { ShoppingContextService } from '@core/services/shopping-context.service';
import {
  formatIrr,
  mockPriceForProduct,
  productIdToNumber
} from '@core/services/search.service';
import {
  BridalCollectionCategory,
  BridalSampleProduct,
  getBridalCategoryBySlug,
  getBridalProductById,
  productsForCategory
} from '@shared/data/bridal-collection-categories';
import { findCategoryForSubSlug, getCatalogCategoryBySlug, CatalogCategory, CatalogSubcategory } from '@shared/data/catalog-categories';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './product-detail.component.html',
  styleUrls: ['./product-detail.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProductDetailComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly cart = inject(CartService);
  private readonly dreamCanvas = inject(DreamCanvasService);
  private readonly shoppingContext = inject(ShoppingContextService);
  private sub?: Subscription;

  product: BridalSampleProduct | null = null;
  category: BridalCollectionCategory | null = null;
  shopParent: CatalogCategory | null = null;
  shopSub: CatalogSubcategory | null = null;
  backLink: string[] = ['/'];
  backLabel = 'بازگشت به صفحه اصلی';
  related: BridalSampleProduct[] = [];
  activeImage = '';
  price = 0;
  priceLabel = '';
  productIdNumber = 0;
  onDreamBoard = false;

  ngOnInit(): void {
    this.sub = this.route.paramMap.subscribe(params => {
      const id = params.get('id')?.trim() || '';
      const found = id ? getBridalProductById(id) : undefined;

      if (!found) {
        void this.router.navigate(['/']);
        return;
      }

      this.product = found;
      this.category = getBridalCategoryBySlug(found.categorySlug) ?? null;
      this.shopParent = null;
      this.shopSub = null;

      const shopMatch = findCategoryForSubSlug(found.categorySlug);
      if (this.category) {
        this.backLink = ['/collections', this.category.slug];
        this.backLabel = 'بازگشت به کالکشن';
      } else if (shopMatch) {
        this.shopParent = shopMatch.category;
        this.shopSub = shopMatch.sub;
        this.backLink = ['/shop', shopMatch.category.slug, shopMatch.sub.slug];
        this.backLabel = `بازگشت به ${shopMatch.sub.label}`;
      } else {
        const parentCat = getCatalogCategoryBySlug(found.categorySlug);
        if (parentCat) {
          this.shopParent = parentCat;
          this.backLink = ['/shop', parentCat.slug];
          this.backLabel = `بازگشت به ${parentCat.title}`;
        } else {
          this.backLink = ['/'];
          this.backLabel = 'بازگشت به صفحه اصلی';
        }
      }

      this.activeImage = found.gallery?.[0] || found.image;
      this.related = productsForCategory(found.categorySlug)
        .filter(p => p.id !== found.id)
        .slice(0, 4);
      this.price = mockPriceForProduct(found.id);
      this.priceLabel = formatIrr(this.price);
      this.productIdNumber = productIdToNumber(found.id);
      this.onDreamBoard = this.dreamCanvas.has(this.productIdNumber);
      this.shoppingContext.rememberPath(
        this.shoppingContext.linkForCategorySlug(found.categorySlug)
      );
      this.cdr.markForCheck();
    });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  galleryImages(): string[] {
    if (!this.product) {
      return [];
    }
    const images = this.product.gallery?.length
      ? this.product.gallery
      : [this.product.image];
    return images;
  }

  selectImage(src: string): void {
    this.activeImage = src;
    this.cdr.markForCheck();
  }

  hideBrokenImage(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.style.visibility = 'hidden';
  }

  addToCart(): void {
    if (!this.product) {
      return;
    }
    this.cart.addProductToCart(
      this.productIdNumber,
      1,
      this.price,
      this.product.name,
      this.product.image,
      {
        categorySlug: this.product.categorySlug,
        sourceId: this.product.id
      }
    );
    void this.router.navigate(['/cart']);
  }

  addToDreamBoard(): void {
    if (!this.product) {
      return;
    }
    const added = this.dreamCanvas.add({
      productId: this.productIdNumber,
      name: this.product.name,
      image: this.product.image,
      price: this.priceLabel,
      slug: this.product.id
    });
    this.onDreamBoard = added || this.dreamCanvas.has(this.productIdNumber);
    this.cdr.markForCheck();
  }
}
