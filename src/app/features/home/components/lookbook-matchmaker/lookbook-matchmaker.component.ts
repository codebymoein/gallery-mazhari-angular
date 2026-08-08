import {
  Component,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  ElementRef,
  PLATFORM_ID,
  ViewChild,
  OnInit,
  inject,
  signal
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { onImgErrorUseFallback } from '@shared/utils/asset-url';

import { RouterLink } from '@angular/router';
import { StylesApiService } from '@core/services/styles-api.service';

export interface LookPackagePiece {
  label: string;
}

export interface LookPackage {
  id: string;
  slug: string;
  title: string;
  style: string;
  mood: string;
  ceremony: string;
  excerpt: string;
  image: string;
  pieces: LookPackagePiece[];
}

@Component({
  selector: 'app-lookbook-matchmaker',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './lookbook-matchmaker.component.html',
  styleUrls: ['./lookbook-matchmaker.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LookbookMatchmakerComponent implements OnInit {
  private readonly stylesApi = inject(StylesApiService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  @ViewChild('track', { static: true }) trackRef!: ElementRef<HTMLElement>;

  readonly canScrollStart = signal(false);
  readonly canScrollEnd = signal(true);

  /** Curated bridal packages — Dress + accessories bundled as complete looks. */
  looks: LookPackage[] = [];
  private readonly legacyLooks: LookPackage[] = [
    { id: '1', slug: 'ivory-reverie', title: 'رویای عاجی', style: 'Timeless European', mood: 'لطیف و جاودانه', ceremony: 'جشن عروسی و فرمالیته', excerpt: 'لباس اروپایی، تور لطیف و جزئیات روشن — زیبایی ماندگار در سادگی.', image: 'assets/images/home-hero-bride.webp', pieces: [{ label: 'لباس اروپایی' }, { label: 'تور سر' }, { label: 'تاج' }, { label: 'کفش' }] },
    { id: '2', slug: 'modern-vow', title: 'پیمان مدرن', style: 'Modern Ceremony', mood: 'آرام و معاصر', ceremony: 'عقد، محضر و جشن کوچک', excerpt: 'کت‌وشلوار عقد با خطوط تمیز، کیف ظریف و زیورآلات مینیمال.', image: 'assets/images/cat-bridal-clothing.webp', pieces: [{ label: 'کت‌وشلوار' }, { label: 'کیف' }, { label: 'زیورآلات' }, { label: 'کفش' }] },
    { id: '3', slug: 'golden-harmony', title: 'هماهنگی طلایی', style: 'Golden Harmony', mood: 'گرم و هماهنگ', ceremony: 'عروسی کلاسیک و مجلل', excerpt: 'تور، تاج، زیورآلات و کیف در یک روایت طلایی منسجم.', image: 'assets/images/bridal-hair-accessories.webp', pieces: [{ label: 'تور سر' }, { label: 'تاج' }, { label: 'زیورآلات' }, { label: 'دسته‌گل' }] },
    { id: '4', slug: 'pearl-whisper', title: 'نجوای مروارید', style: 'Soft Mermaid', mood: 'رمانتیک و درخشان', ceremony: 'عروسی شب و فرمالیته', excerpt: 'مدل ماهی، شنل لطیف، تل مرواریدی و کفش درخشان — یک پکیج کامل.', image: 'assets/images/cat-veil.webp', pieces: [{ label: 'مدل ماهی' }, { label: 'شنل' }, { label: 'تل' }, { label: 'کفش' }] }
  ];

  ngOnInit(): void {
    // Kept only as a migration reference; never rendered on the storefront.
    void this.legacyLooks;
    if (!this.isBrowser) return;

    this.stylesApi.list().subscribe({
      next: rows => {
        if (!rows.length) {
          this.looks = [];
          this.cdr.markForCheck();
          return;
        }
        this.looks = rows.map(row => ({
          id: row.id,
          slug: row.slug || row.id,
          title: row.name,
          style: row.style || '',
          mood: row.mood || '',
          ceremony: row.ceremony || '',
          excerpt: row.subtitle || row.story || '',
          image: row.images?.[0] || row.coverImageUrl || 'assets/images/home-hero-bride.webp',
          pieces: row.products.map(product => ({ label: product.category }))
        }));
        this.cdr.markForCheck();
      },
      error: () => {
        this.looks = [];
        this.cdr.markForCheck();
      }
    });
  }

  hideBrokenImage(event: Event): void { onImgErrorUseFallback(event); }

  onTrackScroll(): void {
    const el = this.trackRef?.nativeElement;
    if (!el) return;
    const maxScroll = el.scrollWidth - el.clientWidth;
    if (maxScroll <= 4) {
      this.canScrollStart.set(false);
      this.canScrollEnd.set(false);
      return;
    }
    const pos = Math.abs(el.scrollLeft);
    this.canScrollStart.set(pos > 8);
    this.canScrollEnd.set(pos < maxScroll - 8);
  }

  scroll(direction: 1 | -1): void {
    const el = this.trackRef?.nativeElement;
    if (!el) return;
    const amount = Math.min(el.clientWidth * 0.82, 320);
    el.scrollBy({ left: direction * -amount, behavior: 'smooth' });
  }
}
