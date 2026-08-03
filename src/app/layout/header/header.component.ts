import {
  Component, OnDestroy, HostListener,
  ChangeDetectionStrategy, inject,
  ViewChild, TemplateRef, ElementRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
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

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HeaderComponent implements OnDestroy {
  private router = inject(Router);
  private host = inject(ElementRef<HTMLElement>);
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

  @ViewChild('drawerTpl') drawerTpl!: TemplateRef<unknown>;

  /** Desktop mega-menu + mobile: bridal clothing with full subcategories. */
  bridalCategory: CatalogCategory = BRIDAL_CLOTHING_CATEGORY;

  /** Desktop mega-menu + mobile: accessory store groups with full subcategories. */
  accessoryCategories: CatalogCategory[] = ACCESSORY_STORE_CATEGORIES;

  constructor() {
    this.cartCount$ = inject(CartService).getItemCount();
    this.routerEventsSubscription = this.router.events
      .pipe(filter((event): event is NavigationStart | NavigationEnd => event instanceof NavigationStart || event instanceof NavigationEnd))
      .subscribe(() => this.closeMenus());
  }

  ngOnDestroy(): void {
    this.routerEventsSubscription.unsubscribe();
    this.drawer.close();
  }

  toggleSearch(): void {
    this.isSearchOpen = !this.isSearchOpen;
    if (this.drawer.isOpen()) this.drawer.close();
    if (this.isSearchOpen) {
      window.setTimeout(() => {
        const input = this.host.nativeElement.querySelector('#nav-search-input') as HTMLInputElement | null;
        input?.focus();
      });
    }
  }

  onSearch(): void {
    const q = this.searchQuery.trim();
    this.router.navigate(['/catalog'], { queryParams: q ? { s: q } : {} });
    this.isSearchOpen = false;
    this.drawer.close();
  }

  closeMenus(): void {
    this.isSearchOpen = false;
    this.drawer.close();
    this.closeOpenDetails();
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

  goToConsultation(event?: Event): void {
    event?.preventDefault();
    this.closeMenus();
    const scrollToAppointment = (): void => {
      document.getElementById('appointment')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };
    if (this.router.url === '/' || this.router.url.startsWith('/?') || this.router.url.startsWith('/#')) {
      scrollToAppointment();
      return;
    }
    this.router.navigate(['/'], { fragment: 'appointment' }).then(() => {
      setTimeout(scrollToAppointment, 120);
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
    this.closeMenus();
  }

  @HostListener('window:popstate')
  onBrowserHistoryChange(): void {
    this.closeMenus();
  }

  private hasOpenDetails(): boolean {
    return this.host.nativeElement.querySelectorAll('details[open]').length > 0;
  }

  private closeOpenDetails(): void {
    this.host.nativeElement
      .querySelectorAll('details[open]')
      .forEach((el: Element) => el.removeAttribute('open'));
  }
}
