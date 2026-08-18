import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, OnDestroy, QueryList, ViewChildren, inject } from '@angular/core';

interface TrustItem {
  id: 'heritage' | 'consultation' | 'shopping' | 'shipping';
  label: string;
}

@Component({
  selector: 'app-trust-guarantees',
  standalone: true,
  templateUrl: './trust-guarantees.component.html',
  styleUrl: './trust-guarantees.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TrustGuaranteesComponent implements AfterViewInit, OnDestroy {
  private readonly changeDetector = inject(ChangeDetectorRef);
  @ViewChildren('trustItem') private readonly itemElements!: QueryList<ElementRef<HTMLElement>>;

  motionReady = false;
  readonly visibleItems = new Set<number>();
  private observer?: IntersectionObserver;

  readonly items: TrustItem[] = [
    { id: 'heritage', label: 'از سال ۱۳۳۷' },
    { id: 'shopping', label: 'خرید حضوری و آنلاین' },
    { id: 'consultation', label: 'مشاوره تخصصی عروس' },
    { id: 'shipping', label: 'ارسال سریع و مطمئن به سراسر ایران' }
  ];

  ngAfterViewInit(): void {
    if (typeof window === 'undefined' || matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) {
      this.showAllItems();
      return;
    }

    this.motionReady = true;
    this.observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        const index = Number((entry.target as HTMLElement).dataset['trustIndex']);
        this.visibleItems.add(index);
        this.observer?.unobserve(entry.target);
      }
      this.changeDetector.markForCheck();
    }, { threshold: 0.2, rootMargin: '0px 0px -6% 0px' });

    this.itemElements.forEach((item, index) => {
      item.nativeElement.dataset['trustIndex'] = String(index);
      this.observer?.observe(item.nativeElement);
    });
    this.changeDetector.markForCheck();
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
  }

  private showAllItems(): void {
    this.items.forEach((_, index) => this.visibleItems.add(index));
    this.changeDetector.markForCheck();
  }
}
