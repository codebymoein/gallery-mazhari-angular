import { isPlatformBrowser } from '@angular/common';
import { Component, PLATFORM_ID, computed, inject } from '@angular/core';

import { RouterLink } from '@angular/router';
import { CategoryShowcaseComponent } from './components/category-showcase/category-showcase.component';
import { LookbookMatchmakerComponent } from './components/lookbook-matchmaker/lookbook-matchmaker.component';
import { RealBridesComponent } from './components/real-brides/real-brides.component';
import { HomeAppointmentComponent } from './components/home-appointment/home-appointment.component';
import { TrustGuaranteesComponent } from './components/trust-guarantees/trust-guarantees.component';
import { InteractiveGuideFaqComponent } from './components/interactive-guide-faq/interactive-guide-faq.component';
import { DiscountShowcaseComponent } from './components/discount-showcase/discount-showcase.component';
import { SubcategoryCarouselComponent } from './components/subcategory-carousel/subcategory-carousel.component';
import { HeritageBookComponent } from './components/heritage-book/heritage-book.component';
import { AppearanceApiService } from '@core/services/appearance-api.service';
import { assetUrl } from '@shared/utils/asset-url';

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
    SubcategoryCarouselComponent,
    HeritageBookComponent
  ],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent {
  private readonly appearanceApi = inject(AppearanceApiService);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  readonly bridalImage = computed(() =>
    this.appearanceApi.appearance()?.bridalHeroImage || assetUrl('assets/images/home-hero-bride.webp')
  );
  readonly accessoryImage = computed(() =>
    this.appearanceApi.appearance()?.accessoryHeroImage || assetUrl('assets/images/bridal-hair-accessories.webp')
  );

  constructor() {
    // Appearance customization is decorative and has deterministic fallback assets.
    // Do not make SSR metadata/status rendering depend on an external appearance API.
    if (this.isBrowser) {
      this.appearanceApi.load();
    }
  }
}
