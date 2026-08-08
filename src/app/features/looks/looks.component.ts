import { Component, OnInit, inject } from '@angular/core';

import { RouterLink } from '@angular/router';
import { SeoService } from '@core/services/seo.service';
import { SiteStyle, StylesApiService } from '@core/services/styles-api.service';

@Component({
  selector: 'app-looks',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './looks.component.html',
  styleUrls: ['./looks.component.css']
})
export class LooksComponent implements OnInit {
  private readonly api = inject(StylesApiService);
  private readonly seo = inject(SeoService);
  looks: SiteStyle[] = [];
  loading = true;

  ngOnInit(): void {
    this.seo.applyDynamicSeo({
      title: 'استایل‌های عروس | گالری مظهری',
      description: 'مشاهده استایل‌ها و ترکیب‌های منتخب لباس و اکسسوری عروس در گالری مظهری.',
      canonicalPath: '/looks'
    });
    this.api.list().subscribe({ next: rows => { this.looks = rows; this.loading = false; }, error: () => this.loading = false });
  }

  cover(look: SiteStyle): string { return look.images?.[0] || look.coverImageUrl || 'assets/images/home-hero-bride.webp'; }
}
