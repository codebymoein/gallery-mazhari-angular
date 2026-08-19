import { isPlatformBrowser } from '@angular/common';
import { Component, OnDestroy, PLATFORM_ID, computed, inject, signal } from '@angular/core';

import { RouterLink } from '@angular/router';
import { CategoryShowcaseComponent } from './components/category-showcase/category-showcase.component';
import { LookbookMatchmakerComponent } from './components/lookbook-matchmaker/lookbook-matchmaker.component';
import { RealBridesComponent } from './components/real-brides/real-brides.component';
import { HomeAppointmentComponent } from './components/home-appointment/home-appointment.component';
import { TrustGuaranteesComponent } from './components/trust-guarantees/trust-guarantees.component';
import { InteractiveGuideFaqComponent } from './components/interactive-guide-faq/interactive-guide-faq.component';
import { DiscountShowcaseComponent } from './components/discount-showcase/discount-showcase.component';
import { SubcategoryCarouselComponent } from './components/subcategory-carousel/subcategory-carousel.component';
import { AppearanceApiService } from '@core/services/appearance-api.service';
import { assetUrl } from '@shared/utils/asset-url';

interface HeroSlide {
  title: string;
  cta: string;
  route: string;
  image: string;
  imageAlt: string;
  position: string;
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    RouterLink,
    CategoryShowcaseComponent,
    LookbookMatchmakerComponent,
    RealBridesComponent,
    HomeAppointmentComponent,
    InteractiveGuideFaqComponent,
    TrustGuaranteesComponent,
    DiscountShowcaseComponent,
    SubcategoryCarouselComponent
  ],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css', './home.motion.css']
})
export class HomeComponent implements OnDestroy {
  private readonly appearanceApi = inject(AppearanceApiService);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  readonly activeSlideIndex = signal(0);
  readonly reducedMotion = signal(false);
  readonly slides = computed<HeroSlide[]>(() => [
    {
      title: 'لباس عروس',
      cta: 'مشاهده لباس‌ها',
      route: '/shop/bridal-clothing',
      image: this.appearanceApi.appearance()?.bridalHeroImage || assetUrl('assets/images/home-hero-bride.webp'),
      imageAlt: 'لباس عروس گالری مظهری',
      position: '50% 18%'
    },
    {
      title: 'فروشگاه اکسسوری',
      cta: 'فروشگاه اکسسوری',
      route: '/accessories',
      image: this.appearanceApi.appearance()?.accessoryHeroImage || assetUrl('assets/images/home-complete-selection.webp'),
      imageAlt: 'اکسسوری عروس گالری مظهری',
      position: 'center'
    },
    {
      title: 'کفش، کتونی و کیف عروس',
      cta: 'مشاهده محصولات',
      route: '/shop/bridal-shoes-bags',
      image: assetUrl('assets/images/cat-bridal-footwear-accessories.jpg'),
      imageAlt: 'کفش و کیف عروس',
      position: 'center'
    },
    {
      title: 'محصولات شخصی‌سازی‌شده',
      cta: 'ثبت سفارش',
      route: '/personalized-products',
      image: assetUrl('assets/images/cat-special.webp'),
      imageAlt: 'محصولات شخصی‌سازی‌شده عروس',
      position: 'center'
    },
    {
      title: 'رزرو وقت مشاوره حرفه‌ای',
      cta: 'رزرو مشاوره',
      route: '/consultation',
      image: assetUrl('assets/images/cat-engagement.webp'),
      imageAlt: 'مشاوره تخصصی انتخاب لباس عروس',
      position: 'center'
    }
  ]);

  private autoplayTimer?: ReturnType<typeof setTimeout>;
  private mediaQuery?: MediaQueryList;
  private pointerStartX?: number;
  private pointerId?: number;
  private hovered = false;
  private focused = false;
  private dragging = false;

  private readonly onMotionPreferenceChange = (event: MediaQueryListEvent): void => {
    this.reducedMotion.set(event.matches);
    this.syncAutoplay();
  };

  constructor() {
    // Appearance customization is decorative and has deterministic fallback assets.
    // Do not make SSR metadata/status rendering depend on an external appearance API.
    if (this.isBrowser) {
      this.appearanceApi.load();
      this.mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      this.reducedMotion.set(this.mediaQuery.matches);
      this.mediaQuery.addEventListener('change', this.onMotionPreferenceChange);
      this.syncAutoplay();
    }
  }

  ngOnDestroy(): void {
    this.clearAutoplay();
    this.mediaQuery?.removeEventListener('change', this.onMotionPreferenceChange);
  }

  previousSlide(): void {
    this.selectSlide((this.activeSlideIndex() - 1 + this.slides().length) % this.slides().length);
  }

  nextSlide(): void {
    this.selectSlide((this.activeSlideIndex() + 1) % this.slides().length);
  }

  selectSlide(index: number): void {
    this.activeSlideIndex.set(index);
    this.syncAutoplay();
  }

  setHovered(hovered: boolean): void {
    this.hovered = hovered;
    this.syncAutoplay();
  }

  onFocusIn(): void {
    this.focused = true;
    this.syncAutoplay();
  }

  onFocusOut(event: FocusEvent): void {
    const container = event.currentTarget as HTMLElement;
    const nextTarget = event.relatedTarget as Node | null;
    this.focused = Boolean(nextTarget && container.contains(nextTarget));
    this.syncAutoplay();
  }

  onPointerDown(event: PointerEvent): void {
    if (!event.isPrimary) return;
    const target = event.target instanceof Element ? event.target : null;
    if (target?.closest('button, a, input, select, textarea')) return;
    this.pointerStartX = event.clientX;
    this.pointerId = event.pointerId;
    this.dragging = true;
    (event.currentTarget as HTMLElement).setPointerCapture?.(event.pointerId);
    this.syncAutoplay();
  }

  onPointerUp(event: PointerEvent): void {
    if (event.pointerId !== this.pointerId || this.pointerStartX === undefined) return;
    const distance = event.clientX - this.pointerStartX;
    this.finishPointerInteraction();
    if (Math.abs(distance) >= 48) {
      if (distance < 0) this.previousSlide();
      else this.nextSlide();
    }
  }

  onPointerCancel(): void {
    this.finishPointerInteraction();
  }

  private finishPointerInteraction(): void {
    this.pointerStartX = undefined;
    this.pointerId = undefined;
    this.dragging = false;
    this.syncAutoplay();
  }

  private syncAutoplay(): void {
    this.clearAutoplay();
    if (!this.isBrowser || this.reducedMotion() || this.hovered || this.focused || this.dragging) return;
    this.autoplayTimer = setTimeout(() => {
      this.activeSlideIndex.update(index => (index + 1) % this.slides().length);
      this.syncAutoplay();
    }, 3000);
  }

  private clearAutoplay(): void {
    if (this.autoplayTimer) clearTimeout(this.autoplayTimer);
    this.autoplayTimer = undefined;
  }
}
