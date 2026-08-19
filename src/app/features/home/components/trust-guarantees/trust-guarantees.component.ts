import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, OnDestroy, QueryList, ViewChildren, inject, signal } from '@angular/core';

interface TrustItem {
  id: 'heritage' | 'consultation' | 'shopping' | 'shipping';
  label: string;
  description: string;
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
  readonly expandedItemId = signal<TrustItem['id'] | null>(null);
  private observer?: IntersectionObserver;

  readonly items: TrustItem[] = [
    {
      id: 'heritage',
      label: 'از سال ۱۳۳۷',
      description: 'انتخاب گالری مظهری یعنی تکیه بر نزدیک به هفت دهه تجربه در دنیای عروس. شما از مجموعه‌ای خرید می‌کنید که هم واردکننده و هم تولیدکننده است و حساسیت انتخاب‌های روز عروسی را به‌خوبی می‌شناسد؛ تجربه‌ای طولانی که خیال شما را از اصالت، کیفیت و همراهی مطمئن آسوده می‌کند.'
    },
    {
      id: 'shopping',
      label: 'خرید حضوری و آنلاین',
      description: 'چه ترجیح بدهید محصولات را از نزدیک ببینید و چه از خانه انتخاب کنید، مسیر خرید برای شما ساده و شفاف طراحی شده است. در فروشگاه حضوری فرصت بررسی جزئیات را دارید و در خرید آنلاین نیز اطلاعات، راهنمایی و پشتیبانی لازم تا رسیدن به انتخاب نهایی همراه شماست.'
    },
    {
      id: 'consultation',
      label: 'مشاوره تخصصی عروس',
      description: 'انتخاب لباس و اکسسوری عروس فقط یک خرید معمولی نیست. مشاوران ما با توجه به سبک مراسم، فرم لباس، سلیقه و بودجه شما پیشنهادهای دقیق‌تری ارائه می‌کنند تا اجزای استایل در کنار هم هماهنگ باشند و با اطمینان بیشتری تصمیم بگیرید.'
    },
    {
      id: 'shipping',
      label: 'ارسال سریع و مطمئن به سراسر ایران',
      description: 'سفارش‌ها با بسته‌بندی مطمئن و متناسب با نوع محصول ارسال می‌شوند. پست، تیپاکس و باربری برای شهرهای مختلف در دسترس است و در تهران امکان ارسال با پیک نیز وجود دارد؛ روش مناسب بر اساس مقصد، ابعاد سفارش و فوریت تحویل انتخاب می‌شود.'
    }
  ];

  toggleDetails(id: TrustItem['id']): void {
    this.expandedItemId.update(current => current === id ? null : id);
  }

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
