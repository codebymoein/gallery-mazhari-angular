import { DOCUMENT } from '@angular/common';
import { Injectable, inject } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class PerformanceHintsService {
  private readonly document = inject(DOCUMENT);
  private readonly router = inject(Router);
  private readonly preloadId = 'mazhari-route-lcp-preload';
  private readonly homeLcpImage = 'assets/images/home-hero-bride.webp';

  init(): void {
    this.syncForUrl(this.router.url);
    this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe(event => this.syncForUrl(event.urlAfterRedirects));
  }

  private syncForUrl(url: string): void {
    const path = url.split(/[?#]/, 1)[0] || '/';
    if (path !== '/') {
      this.document.getElementById(this.preloadId)?.remove();
      return;
    }

    let preload = this.document.getElementById(this.preloadId) as HTMLLinkElement | null;
    if (!preload) {
      preload = this.document.createElement('link');
      preload.id = this.preloadId;
      preload.rel = 'preload';
      preload.setAttribute('as', 'image');
      preload.type = 'image/webp';
      preload.setAttribute('fetchpriority', 'high');
      this.document.head.appendChild(preload);
    }
    preload.href = this.homeLcpImage;
  }
}
