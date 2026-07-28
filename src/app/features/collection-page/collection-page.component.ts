import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { ShoppingContextService } from '@core/services/shopping-context.service';
import {
  BRIDAL_COLLECTION_CATEGORIES,
  BridalCollectionCategory,
  BridalSampleProduct,
  productsForCategory
} from '@shared/data/bridal-collection-categories';

@Component({
  selector: 'app-collection-page',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './collection-page.component.html',
  styleUrls: ['./collection-page.component.css']
})
export class CollectionPageComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly shoppingContext = inject(ShoppingContextService);
  private sub?: Subscription;

  readonly collections = BRIDAL_COLLECTION_CATEGORIES;

  activeCollection: BridalCollectionCategory = this.collections[0];
  products: BridalSampleProduct[] = [];
  isAllDresses = false;

  ngOnInit(): void {
    this.sub = this.route.paramMap.subscribe(params => {
      const slug = params.get('slug') ?? this.collections[0].slug;
      this.activeCollection = this.collections.find(c => c.slug === slug) ?? this.collections[0];
      this.isAllDresses = this.activeCollection.slug === 'bridal-clothing';
      this.products = this.expandAndShuffle(
        productsForCategory(this.activeCollection.slug),
        this.isAllDresses ? 12 : 10
      );
      this.shoppingContext.rememberPath(['/collections', this.activeCollection.slug]);
      window.scrollTo({ top: 0, behavior: 'auto' });
    });
  }

  isActive(slug: string): boolean {
    return this.activeCollection.slug === slug;
  }

  hideBrokenImage(event: Event): void {
    (event.currentTarget as HTMLImageElement).hidden = true;
  }

  private expandAndShuffle(source: BridalSampleProduct[], count: number): BridalSampleProduct[] {
    if (source.length === 0) {
      return [];
    }

    const working: BridalSampleProduct[] = [];
    while (working.length < count) {
      working.push(...source);
    }

    const shuffled = [...working];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled.slice(0, count);
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }
}
