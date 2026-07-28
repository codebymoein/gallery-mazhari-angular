import { DOCUMENT } from '@angular/common';
import { Inject, Injectable } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';

export interface SeoData {
  title: string;
  description: string;
  robots?: string;
  image?: string;
  imageAlt?: string;
}

@Injectable({ providedIn: 'root' })
export class SeoService {
  private readonly siteUrl = 'https://gallery-mazhari.ir';
  private readonly defaultImage = `${this.siteUrl}/assets/images/home-hero-bride.webp`;

  constructor(
    private readonly router: Router,
    private readonly title: Title,
    private readonly meta: Meta,
    @Inject(DOCUMENT) private readonly document: Document
  ) {}

  init(): void {
    this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe(() => this.updateFromRoute());

    this.updateFromRoute();
  }

  private updateFromRoute(): void {
    let route = this.router.routerState.snapshot.root;
    while (route.firstChild) route = route.firstChild;

    const seo = route.data['seo'] as SeoData | undefined;
    if (!seo) return;

    const path = this.router.url.split(/[?#]/, 1)[0] || '/';
    const canonicalUrl = `${this.siteUrl}${path === '/' ? '/' : path}`;
    const image = seo.image ? `${this.siteUrl}${seo.image}` : this.defaultImage;
    const robots = this.router.url.includes('?s=')
      ? 'noindex,follow'
      : (seo.robots ?? 'index,follow,max-image-preview:large');

    this.title.setTitle(seo.title);
    this.meta.updateTag({ name: 'description', content: seo.description });
    this.meta.updateTag({ name: 'robots', content: robots });
    this.meta.updateTag({ property: 'og:title', content: seo.title });
    this.meta.updateTag({ property: 'og:description', content: seo.description });
    this.meta.updateTag({ property: 'og:url', content: canonicalUrl });
    this.meta.updateTag({ property: 'og:image', content: image });
    this.meta.updateTag({
      property: 'og:image:alt',
      content: seo.imageAlt ?? 'گالری مظهری'
    });
    this.meta.updateTag({ name: 'twitter:title', content: seo.title });
    this.meta.updateTag({ name: 'twitter:description', content: seo.description });
    this.meta.updateTag({ name: 'twitter:image', content: image });
    this.setCanonical(canonicalUrl);
  }

  private setCanonical(url: string): void {
    let canonical = this.document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!canonical) {
      canonical = this.document.createElement('link');
      canonical.rel = 'canonical';
      this.document.head.appendChild(canonical);
    }
    canonical.href = url;
  }
}
