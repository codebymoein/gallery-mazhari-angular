import {
  Component, OnDestroy, HostListener,
  ChangeDetectionStrategy, inject,
  ViewChild, TemplateRef, ElementRef
} from '@angular/core';
import { CommonModule, DOCUMENT, isPlatformBrowser } from '@angular/common';
import { NgZone, PLATFORM_ID, signal } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { NavigationEnd, NavigationStart } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CartService } from '@core/services/cart.service';
import { DrawerService } from '@core/services/drawer.service';
import {
  ACCESSORY_STORE_CATEGORIES,
  BRIDAL_CLOTHING_CATEGORY,
  CatalogCategory,
  findCategoryForSubSlug
} from '@shared/data/catalog-categories';
import { Observable, Subscription, filter } from 'rxjs';
import { LineIconComponent } from '@shared/components/line-icon/line-icon.component';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, LineIconComponent],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css', './header-actions.css', './header-motion.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HeaderComponent implements OnDestroy {
  private router = inject(Router);
  private host = inject(ElementRef<HTMLElement>);
  private document = inject(DOCUMENT);
  private readonly zone = inject(NgZone);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly collectionSlugs = new Set([
    'bridal-clothing',
    'arabic-bridal-dresses',
    'european-bridal-dresses',
    'mermaid-bridal-dresses',
    'engagement-dresses'
  ]);

  drawer = inject(DrawerService);

  isSearchOpen = false;
  searchQuery  = '';
  cartCount$: Observable<number>;
  private readonly routerEventsSubscription: Subscription;
  private isDesktopViewport: boolean;
  private scrollFrame: number | null = null;
  private lastScrollY = 0;
  private scrollDirection = 0;
  private scrollDistance = 0;
  private removeScrollListener: (() => void) | null = null;

  readonly isHeaderHidden = signal(false);

  @ViewChild('drawerTpl') drawerTpl!: TemplateRef<unknown>;
  @ViewChild('menuToggle', { read: ElementRef }) menuToggle?: ElementRef<HTMLButtonElement>;

  /** Desktop mega-menu + mobile: bridal clothing with full subcategories. */
  bridalCategory: CatalogCategory = BRIDAL_CLOTHING_CATEGORY;

  /** Desktop mega-menu + mobile: accessory store groups with full subcategories. */
  accessoryCategories: CatalogCategory[] = ACCESSORY_STORE_CATEGORIES;

  constructor() {
    this.cartCount$ = inject(CartService).getItemCount();
    this.isDesktopViewport = this.matchesDesktopViewport();
    this.routerEventsSubscription = this.router.events
      .pipe(filter((event): event is NavigationStart | NavigationEnd => event instanceof NavigationStart || event instanceof NavigationEnd))
      .subscribe(() => this.closeMenus());
    this.initScrollAwareness();
  }

  ngOnDestroy(): void {
    this.routerEventsSubscription.unsubscribe();
    this.removeScrollListener?.();
    if (this.scrollFrame !== null) {
      this.document.defaultView?.cancelAnimationFrame(this.scrollFrame);
    }
    this.drawer.close();
  }

  toggleSearch(): void {
    this.isSearchOpen = !this.isSearchOpen;
    this.revealHeader();
    if (this.drawer.isOpen()) this.closeDrawer(false);
    if (this.isSearchOpen) {
      this.document.defaultView?.setTimeout(() => {
        const input = this.host.nativeElement.querySelector('#nav-search-input') as HTMLInputElement | null;
        input?.focus();
      });
    }
  }

  onSearch(): void {
    const q = this.searchQuery.trim();
    this.router.navigate(['/catalog'], { queryParams: q ? { s: q } : {} });
    this.isSearchOpen = false;
    this.closeDrawer(false);
  }

  toggleDrawer(): void {
    if (this.drawer.isOpen()) {
      this.closeDrawer();
      return;
    }

    this.isSearchOpen = false;
    this.resetDrawerState();
    this.drawer.open();
    this.revealHeader();
    this.focusDrawerCloseWhenReady();
  }

  closeDrawer(restoreFocus = true): void {
    const wasOpen = this.drawer.isOpen();
    this.drawer.close();
    this.resetDrawerState();
    if (wasOpen && restoreFocus) {
      this.document.defaultView?.setTimeout(() => this.menuToggle?.nativeElement.focus());
    }
  }

  focusFirstDrawerControl(): void {
    this.focusDrawerCloseWhenReady();
  }

  focusLastDrawerControl(): void {
    this.document
      .querySelector<HTMLAnchorElement>('.luxury-nav__drawer-nav > a:last-of-type')
      ?.focus();
  }

  closeMenus(): void {
    this.isSearchOpen = false;
    this.closeDrawer(false);
    this.closeOpenDetails();
  }

  goHomeTop(event: Event): void {
    event.preventDefault();
    this.closeMenus();
    this.revealHeader();

    const scrollToTop = (): void => {
      const view = this.document.defaultView;
      if (!view) return;
      const reduceMotion = view.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
      view.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
      this.resetScrollTracking(0);
    };

    const currentPath = this.router.url.split(/[?#]/, 1)[0] || '/';
    if (currentPath === '/') {
      scrollToTop();
      return;
    }

    void this.router.navigateByUrl('/').then(navigated => {
      if (navigated) scrollToTop();
    });
  }

  bridalItemLink(slug: string): string[] {
    if (this.collectionSlugs.has(slug)) {
      return ['/collections', slug];
    }
    const found = findCategoryForSubSlug(slug);
    if (found) {
      return ['/shop', found.category.slug, found.sub.slug];
    }
    return ['/shop', 'bridal-clothing'];
  }

  bridalItemQueryParams(_slug: string): null {
    return null;
  }

  accessoryItemLink(groupSlug: string, itemSlug: string): string[] {
    return ['/shop', groupSlug, itemSlug];
  }

  cartCountLabel(count: number): string {
    return count > 99 ? '99+' : String(count);
  }

  goToConsultation(event?: Event): void {
    event?.preventDefault();
    this.closeMenus();
    const scrollToAppointment = (): void => {
      this.document.getElementById('appointment')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };
    if (this.router.url === '/' || this.router.url.startsWith('/?') || this.router.url.startsWith('/#')) {
      scrollToAppointment();
      return;
    }
    this.router.navigate(['/'], { fragment: 'appointment' }).then(() => {
      this.document.defaultView?.setTimeout(scrollToAppointment, 120);
    });
  }

  goToContact(event: Event): void {
    event.preventDefault();
    this.closeMenus();
    void this.router.navigate(['/contact']);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as Node | null;
    if (!target) {
      return;
    }

    const path = typeof event.composedPath === 'function'
      ? event.composedPath()
      : [];

    const clickedInsideHeader = this.host.nativeElement.contains(target);
    const clickedInsideDrawer = path.some(
      (node) => node instanceof Element && node.classList?.contains('luxury-nav__drawer')
    );
    const clickedToggle = path.some(
      (node) =>
        node instanceof Element &&
        (node.classList?.contains('luxury-nav__menu-toggle') ||
          node.closest?.('.luxury-nav__menu-toggle') != null)
    );

    if (clickedToggle) {
      return;
    }

    if (!clickedInsideHeader && !clickedInsideDrawer) {
      if (this.drawer.isOpen() || this.isSearchOpen || this.hasOpenDetails()) {
        this.closeMenus();
      }
      return;
    }

    // Close open mega-menus when clicking another area inside the header bar
    // (but not when interacting with an open details itself).
    if (clickedInsideHeader) {
      const openDetails = Array.from(
        this.host.nativeElement.querySelectorAll('details[open]')
      ) as HTMLDetailsElement[];
      for (const details of openDetails) {
        if (!details.contains(target as Node)) {
          details.removeAttribute('open');
        }
      }
    }
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    const shouldRestoreDrawerFocus = this.drawer.isOpen();
    this.isSearchOpen = false;
    this.closeOpenDetails();
    this.closeDrawer(shouldRestoreDrawerFocus);
  }

  @HostListener('window:popstate')
  onBrowserHistoryChange(): void {
    this.closeMenus();
  }

  @HostListener('window:orientationchange')
  onOrientationChange(): void {
    this.closeMenus();
    this.resetScrollTracking();
  }

  @HostListener('window:resize')
  onViewportResize(): void {
    this.resetScrollTracking();
    const isDesktopViewport = this.matchesDesktopViewport();
    if (isDesktopViewport === this.isDesktopViewport) return;

    this.isDesktopViewport = isDesktopViewport;
    this.closeMenus();
  }

  private focusDrawerCloseWhenReady(attempt = 0): void {
    if (!this.drawer.isOpen()) return;

    const closeButton = this.document
      .querySelector<HTMLButtonElement>('.luxury-nav__drawer-close');
    const drawerElement = closeButton
      ?.closest<HTMLElement>('.luxury-nav__drawer');

    if (closeButton && drawerElement && !drawerElement.hasAttribute('inert')) {
      closeButton.focus({ preventScroll: true });
      if (this.document.activeElement === closeButton) return;
    }

    if (attempt < 60) {
      this.document.defaultView?.requestAnimationFrame(() => {
        this.focusDrawerCloseWhenReady(attempt + 1);
      });
    }
  }

  private hasOpenDetails(): boolean {
    return this.host.nativeElement.querySelectorAll('details[open]').length > 0;
  }

  private closeOpenDetails(): void {
    this.host.nativeElement
      .querySelectorAll('details[open]')
      .forEach((el: Element) => el.removeAttribute('open'));
  }

  private resetDrawerState(): void {
    const drawerElement = this.document.getElementById('storefront-drawer');
    if (!drawerElement) return;

    drawerElement
      .querySelectorAll('details[open]')
      .forEach((el: Element) => el.removeAttribute('open'));
    drawerElement
      .querySelector<HTMLElement>('.luxury-nav__drawer-nav')
      ?.scrollTo({ top: 0, behavior: 'auto' });
  }

  private matchesDesktopViewport(): boolean {
    const view = this.document.defaultView;
    return typeof view?.matchMedia === 'function'
      ? view.matchMedia('(min-width: 64rem)').matches
      : false;
  }

  private initScrollAwareness(): void {
    const view = this.document.defaultView;
    if (!this.isBrowser || !view) return;

    this.lastScrollY = Math.max(0, view.scrollY);
    const onScroll = (): void => {
      if (this.scrollFrame !== null) return;
      this.scrollFrame = view.requestAnimationFrame(() => {
        this.scrollFrame = null;
        this.updateHeaderForScroll(Math.max(0, view.scrollY));
      });
    };

    this.zone.runOutsideAngular(() => {
      view.addEventListener('scroll', onScroll, { passive: true });
    });
    this.removeScrollListener = () => view.removeEventListener('scroll', onScroll);
  }

  private updateHeaderForScroll(scrollY: number): void {
    if (scrollY <= 8 || this.drawer.isOpen() || this.isSearchOpen || this.searchContainsFocus()) {
      this.revealHeader();
      this.resetScrollTracking(scrollY);
      return;
    }

    const delta = scrollY - this.lastScrollY;
    this.lastScrollY = scrollY;
    if (Math.abs(delta) < 1) return;

    const direction = Math.sign(delta);
    if (direction !== this.scrollDirection) {
      this.scrollDirection = direction;
      this.scrollDistance = 0;
    }
    this.scrollDistance += delta;

    if (direction > 0 && this.scrollDistance >= 16) {
      this.setHeaderHidden(true);
      this.scrollDistance = 0;
    } else if (direction < 0 && this.scrollDistance <= -10) {
      this.setHeaderHidden(false);
      this.scrollDistance = 0;
    }
  }

  private searchContainsFocus(): boolean {
    const activeElement = this.document.activeElement;
    return activeElement?.closest('.luxury-nav__search-toggle, #storefront-search') != null;
  }

  private revealHeader(): void {
    this.setHeaderHidden(false);
  }

  private setHeaderHidden(hidden: boolean): void {
    if (this.isHeaderHidden() === hidden) return;
    this.zone.run(() => this.isHeaderHidden.set(hidden));
  }

  private resetScrollTracking(scrollY = Math.max(0, this.document.defaultView?.scrollY ?? 0)): void {
    this.lastScrollY = scrollY;
    this.scrollDirection = 0;
    this.scrollDistance = 0;
  }
}
