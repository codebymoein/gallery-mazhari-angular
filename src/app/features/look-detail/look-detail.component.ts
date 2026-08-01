
import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { SiteStyle, StyleHotspot, StyleProduct, StylesApiService } from '@core/services/styles-api.service';
import { getPublishedProducts } from '@shared/data/published-products';

@Component({
  selector: 'app-look-detail',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './look-detail.component.html',
  styleUrls: ['./look-detail.component.css']
})
export class LookDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly api = inject(StylesApiService);
  look: SiteStyle | null = null;
  activeImage = '';
  error = '';
  activeHotspot = '';
  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id') || '';
    this.api.get(id).subscribe({
      next: look => {
        if (!look.products?.length && look.productCodes?.length) {
          const codes = new Set(look.productCodes.map(code => code.toUpperCase()));
          look.products = getPublishedProducts()
            .filter(product => codes.has(product.code.toUpperCase()))
            .map(product => ({
              id: product.id,
              code: product.code,
              name: product.name,
              category: product.tag || product.categorySlug,
              price: product.price,
              photos: (product.gallery || [product.image]).map(url => ({ url }))
            }));
        }
        this.look = look;
        this.activeImage = this.images[0] || '';
      },
      error: () => this.error = 'این استایل پیدا نشد یا هنوز منتشر نشده است.'
    });
  }
  get images(): string[] {
    if (!this.look) return [];
    return (this.look.images?.length ? this.look.images : [this.look.coverImageUrl || '']).filter(Boolean).slice(0, 5);
  }
  get activeImageIndex(): number { return Math.max(0, this.images.indexOf(this.activeImage)); }
  get activeHotspots(): StyleHotspot[] {
    return (this.look?.hotspots ?? []).filter(point => point.imageIndex === this.activeImageIndex);
  }
  selectImage(image: string): void { this.activeImage = image; this.activeHotspot = ''; }
  activateHotspot(point: StyleHotspot): void {
    const key = this.hotspotKey(point);
    if (this.activeHotspot === key) {
      void this.router.navigate(['/product', point.productCode]);
      return;
    }
    this.activeHotspot = key;
  }
  hotspotKey(point: StyleHotspot): string { return `${point.imageIndex}:${point.productCode}`; }
  productImage(product: StyleProduct): string { return product.photos?.[0]?.url || 'assets/images/product-placeholder.webp'; }
}
