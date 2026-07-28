import { Component, OnInit, ViewChild, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs/operators';
import { HeaderComponent } from './layout/header/header.component';
import { FooterComponent } from './layout/footer/footer.component';
import { LoadingScreenComponent } from './shared/components/loading-screen/loading-screen.component';
import { DreamCanvasWidgetComponent } from './shared/components/dream-canvas-widget/dream-canvas-widget.component';
import { WeddingTimelineWidgetComponent } from './shared/components/wedding-timeline-widget/wedding-timeline-widget.component';
import { ConsultationToastComponent } from './shared/components/consultation-toast/consultation-toast.component';
import { ArMagicMirrorComponent } from './shared/components/ar-magic-mirror/ar-magic-mirror.component';
import { SeoService } from './core/services/seo.service';
import { PublishedCatalogSyncService } from './core/services/published-catalog-sync.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    HeaderComponent,
    FooterComponent,
    LoadingScreenComponent,
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
  private readonly router = inject(Router);
  private readonly publishedSync = inject(PublishedCatalogSyncService);

  /** Hide storefront chrome on /admin routes for a focused ops UI. */
  readonly isAdminShell = signal(false);

  ngOnInit(): void {
    this.seoService.init();
    this.publishedSync.refresh();
    this.syncAdminShell(this.router.url);

    this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe((e) => this.syncAdminShell(e.urlAfterRedirects));

    // Force light theme — dark mode toggle removed from the site.
    document.documentElement.setAttribute('data-theme', 'light');
    document.body.setAttribute('data-theme', 'light');
    document.documentElement.classList.remove('dark-mode');
    document.body.classList.remove('dark-mode');
    document.documentElement.style.colorScheme = 'light';
    try {
      localStorage.removeItem('gm-theme');
      localStorage.removeItem('mazhari_theme');
    } catch {
      // Ignore storage errors.
    }
  }

  private syncAdminShell(url: string): void {
    this.isAdminShell.set(url.split('?')[0].startsWith('/admin'));
  }
}
