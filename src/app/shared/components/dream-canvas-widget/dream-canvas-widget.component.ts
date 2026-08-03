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

  @ViewChild('dialogEl') dialogEl?: ElementRef<HTMLElement>;
  @ViewChild('triggerBtn') triggerBtn?: ElementRef<HTMLButtonElement>;

  hiddenOnRoute = false;
  dockVisible = false;
  private routeSub: Subscription;
  private openSub?: Subscription;

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
    this.openSub = this.canvas.isOpen$.subscribe(() => {
      this.cdr.markForCheck();
    });
  }

  ngOnDestroy(): void {
    this.routeSub.unsubscribe();
    this.openSub?.unsubscribe();
    document.documentElement.classList.remove('dream-canvas-modal-open');
    document.body.classList.remove('dream-canvas-modal-open');
  }

  open(): void {
    document.documentElement.classList.add('dream-canvas-modal-open');
    document.body.classList.add('dream-canvas-modal-open');
    this.canvas.open();
  }

  close(): void {
    const top = window.scrollY;
    this.canvas.close();
    document.documentElement.classList.remove('dream-canvas-modal-open');
    document.body.classList.remove('dream-canvas-modal-open');
    const restoreViewport = () => {
      document.documentElement.scrollLeft = 0;
      document.body.scrollLeft = 0;
      window.scrollTo({ left: 0, top, behavior: 'auto' });
    };
    requestAnimationFrame(() => {
      restoreViewport();
      requestAnimationFrame(restoreViewport);
    });
  }

  onDialogClose(): void {
    if (this.canvas.isOpen()) {
      this.close();
    }
  }

  onDialogClick(event: MouseEvent): void {
    if (event.target === this.dialogEl?.nativeElement) this.close();
  }

  remove(productId: number): void {
    this.canvas.remove(productId);
  }

  exportPdf(): void {
    const items = this.canvas.items;
    if (!items.length) return;
    const popup = window.open('', '_blank', 'width=900,height=1100');
    if (!popup) return;
    const rows = items.map((item, index) => {
      const url = `${window.location.origin}/product/${encodeURIComponent(String(item.productId))}`;
      const image = item.image ? `<img src="${this.escapeHtml(item.image)}" alt="">` : '';
      return `<article>${image}<div><b>${index + 1}. ${this.escapeHtml(item.name)}</b>${item.price ? `<span>${this.escapeHtml(item.price)}</span>` : ''}<a href="${url}">${url}</a></div></article>`;
    }).join('');
    popup.document.write(`<!doctype html><html lang="fa" dir="rtl"><head><meta charset="utf-8"><title>بوم رویایی گالری مظهری</title><style>@page{size:A4;margin:14mm}body{font-family:Tahoma,Arial;color:#2b251f}header{text-align:center;border-bottom:2px solid #a98036;padding-bottom:14px}h1{font-size:22px}article{display:flex;gap:14px;align-items:center;padding:12px 0;border-bottom:1px solid #ddd;break-inside:avoid}img{width:76px;height:76px;object-fit:cover;border-radius:8px}article div{display:grid;gap:6px}span{color:#756e67}a{color:#765617;font-size:11px;direction:ltr;text-align:left}</style></head><body><header><h1>بوم رویایی من</h1><p>گالری مظهری</p></header>${rows}<script>onload=()=>setTimeout(()=>print(),150)<\/script></body></html>`);
    popup.document.close();
  }

  requestConsultation(): void {
    this.close();
    void this.router.navigate(['/dream-canvas'], { fragment: 'consult' }).then(() => setTimeout(() => document.getElementById('consult')?.scrollIntoView({ behavior: 'smooth' }), 120));
  }

  private escapeHtml(value: string): string {
    return String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
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
      this.close();
    }
  }

  @HostListener('document:pointerdown', ['$event'])
  onOutsidePointer(event: PointerEvent): void {
    if (!this.canvas.isOpen()) return;
    const dialog = this.dialogEl?.nativeElement;
    if (dialog && !dialog.contains(event.target as Node)) this.close();
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
