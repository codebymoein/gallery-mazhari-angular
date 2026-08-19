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
      description: 'گالری مظهری از سال ۱۳۳۷ با نزدیک به هفت دهه تجربه تخصصی در حوزه عروس، همراه نسل‌های مختلف عروس‌های ایرانی بوده است. فعالیت هم‌زمان به‌عنوان تولیدکننده و واردکننده، امکان انتخاب مستقیم، دقیق و مطمئن از میان محصولات اصیل و باکیفیت را فراهم کرده است. انتخاب گالری مظهری، انتخاب مجموعه‌ای باسابقه است که اهمیت و حساسیت جزئیات روز عروسی را می‌شناسد و اعتبار خود را بر پایه کیفیت، تخصص و اعتماد مشتریان بنا کرده است.'
    },
    {
      id: 'shopping',
      label: 'خرید حضوری و آنلاین',
      description: 'امکان خرید حضوری و آنلاین فراهم شده است تا در هر نقطه از ایران، تجربه‌ای مطمئن و حرفه‌ای از انتخاب محصولات گالری مظهری داشته باشید. در مراجعه حضوری می‌توانید کیفیت، جزئیات و تناسب محصولات را از نزدیک بررسی کنید؛ در خرید آنلاین نیز تصاویر، اطلاعات دقیق و پشتیبانی کارشناسان مجموعه در اختیار شما قرار می‌گیرد تا با آگاهی کامل انتخاب کنید. از نخستین پرسش تا ثبت سفارش و دریافت محصول، همراه شما خواهیم بود.'
    },
    {
      id: 'consultation',
      label: 'مشاوره تخصصی عروس',
      description: 'انتخاب لباس و اکسسوری عروس، تصمیمی مهم و کاملاً شخصی است. مشاوره تخصصی و رایگان گالری مظهری، تجربه و دانش کارشناسان این حوزه را در اختیار شما قرار می‌دهد تا متناسب با سبک مراسم، فرم لباس، سلیقه، نیاز و بودجه خود بهترین انتخاب را داشته باشید. هدف ما ارائه پیشنهادهایی دقیق، صادقانه و هماهنگ است تا تمام اجزای استایل عروس در کنار یکدیگر کامل شوند و با آرامش و اطمینان تصمیم بگیرید.'
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
