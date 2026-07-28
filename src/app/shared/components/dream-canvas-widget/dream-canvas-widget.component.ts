import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  HostListener,
  OnDestroy,
  ViewChild,
  inject
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, NavigationEnd } from '@angular/router';
import { Subscription, filter } from 'rxjs';
import { DreamCanvasService } from '@core/services/dream-canvas.service';
import { ShoppingContextService } from '@core/services/shopping-context.service';
import { getBridalProductById } from '@shared/data/bridal-collection-categories';

@Component({
  selector: 'app-dream-canvas-widget',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dream-canvas-widget.component.html',
  styleUrls: ['./dream-canvas-widget.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DreamCanvasWidgetComponent implements AfterViewInit, OnDestroy {
  readonly canvas = inject(DreamCanvasService);
  private readonly router = inject(Router);
  private readonly shoppingContext = inject(ShoppingContextService);
  private readonly cdr = inject(ChangeDetectorRef);

  @ViewChild('dialogEl') dialogEl?: ElementRef<HTMLDialogElement>;
  @ViewChild('triggerBtn') triggerBtn?: ElementRef<HTMLButtonElement>;

  hiddenOnRoute = false;
  dockVisible = false;
  private routeSub: Subscription;
  private openSub?: Subscription;
  private viewReady = false;

  constructor() {
    this.hiddenOnRoute = this.isSensitiveRoute(this.router.url);
    this.updateDockVisibility();

    this.routeSub = this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe((event) => {
        this.hiddenOnRoute = this.isSensitiveRoute(event.urlAfterRedirects);
        if (this.hiddenOnRoute) {
          this.canvas.close();
        }
        this.updateDockVisibility();
        this.cdr.markForCheck();
      });
  }

  ngAfterViewInit(): void {
    this.viewReady = true;
    this.openSub = this.canvas.isOpen$.subscribe((open) => {
      this.syncDialog(open);
      this.cdr.markForCheck();
    });
    this.syncDialog(this.canvas.isOpen());
  }

  ngOnDestroy(): void {
    this.routeSub.unsubscribe();
    this.openSub?.unsubscribe();
  }

  open(): void {
    this.canvas.open();
  }

  close(): void {
    this.canvas.close();
  }

  onDialogClose(): void {
    if (this.canvas.isOpen()) {
      this.canvas.close();
    }
  }

  remove(productId: number): void {
    this.canvas.remove(productId);
  }

  persianCount(count: number): string {
    return count.toLocaleString('fa-IR');
  }

  /** Continue shopping toward the latest dream-board item's category. */
  continueShoppingLink(): string[] {
    const items = this.canvas.items;
    if (!items.length) {
      return this.shoppingContext.continueShoppingLink([]);
    }
    const latest = [...items].sort(
      (a, b) => Date.parse(b.addedAt) - Date.parse(a.addedAt)
    )[0];
    const product = latest.slug ? getBridalProductById(latest.slug) : undefined;
    if (product?.categorySlug) {
      return this.shoppingContext.linkForCategorySlug(product.categorySlug);
    }
    return this.shoppingContext.continueShoppingLink([]);
  }

  @HostListener('window:scroll')
  onScroll(): void {
    this.updateDockVisibility();
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.canvas.isOpen()) {
      this.canvas.close();
    }
  }

  private syncDialog(open: boolean): void {
    if (!this.viewReady) {
      return;
    }
    const dialog = this.dialogEl?.nativeElement;
    if (!dialog) {
      return;
    }
    if (open && !dialog.open) {
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
      this.triggerBtn?.nativeElement.focus();
    }
  }

  private updateDockVisibility(): void {
    const onHome = this.router.url === '/' || this.router.url.startsWith('/?');
    this.dockVisible = !onHome || window.scrollY > window.innerHeight * 0.55;
    this.cdr.markForCheck();
  }

  private isSensitiveRoute(url: string): boolean {
    return /^\/(cart|account)(\/|$)/.test(url);
  }
}
