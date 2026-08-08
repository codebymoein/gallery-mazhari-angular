import {
  Component,
  DOCUMENT,
  OnInit,
  PLATFORM_ID,
  ViewChild,
  afterNextRender,
  inject,
  signal
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs/operators';
import { HeaderComponent } from './layout/header/header.component';
import { FooterComponent } from './layout/footer/footer.component';
import { DreamCanvasWidgetComponent } from './shared/components/dream-canvas-widget/dream-canvas-widget.component';
import { WeddingTimelineWidgetComponent } from './shared/components/wedding-timeline-widget/wedding-timeline-widget.component';
import { ConsultationToastComponent } from './shared/components/consultation-toast/consultation-toast.component';
import { ArMagicMirrorComponent } from './shared/components/ar-magic-mirror/ar-magic-mirror.component';
import { SeoService } from './core/services/seo.service';
import { PerformanceHintsService } from './core/services/performance-hints.service';
import { PublishedCatalogSyncService } from './core/services/published-catalog-sync.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    HeaderComponent,
    FooterComponent,
    DreamCanvasWidgetComponent,
    WeddingTimelineWidgetComponent,
    ConsultationToastComponent,
    ArMagicMirrorComponent
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  title = 'گالری مظهری';

  @ViewChild('header') headerRef?: HeaderComponent;

  private readonly seoService = inject(SeoService);
  private readonly performanceHints = inject(PerformanceHintsService);
  private readonly router = inject(Router);
  private readonly publishedSync = inject(PublishedCatalogSyncService);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly document = inject(DOCUMENT);
  private readonly isBrowser = isPlatformBrowser(this.platformId);

  /** Hide storefront chrome on /admin routes for a focused ops UI. */
  readonly isAdminShell = signal(false);
  readonly isFocusedForm = signal(false);
  readonly browserToolsReady = signal(false);

  constructor() {
    afterNextRender(() => {
      if (!this.isBrowser) return;
      this.publishedSync.refresh();
      this.applyBrowserTheme();
      this.browserToolsReady.set(true);
    });
  }

  ngOnInit(): void {
    this.seoService.init();
    this.performanceHints.init();
    this.syncAdminShell(this.router.url);

    this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe((e) => this.syncAdminShell(e.urlAfterRedirects));
  }

  private applyBrowserTheme(): void {
    this.document.documentElement.setAttribute('data-theme', 'light');
    this.document.body.setAttribute('data-theme', 'light');
    this.document.documentElement.classList.remove('dark-mode');
    this.document.body.classList.remove('dark-mode');
    this.document.documentElement.style.colorScheme = 'light';

    try {
      localStorage.removeItem('gm-theme');
      localStorage.removeItem('mazhari_theme');
    } catch {
      // Ignore storage errors.
    }
  }

  private syncAdminShell(url: string): void {
    const path = url.split('?')[0];
    this.isAdminShell.set(path.startsWith('/admin'));
    this.isFocusedForm.set(path.startsWith('/custom-request/'));
  }
}
