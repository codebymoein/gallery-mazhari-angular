import {
  Component,
  ChangeDetectionStrategy,
  HostListener,
  OnDestroy,
  computed,
  inject,
  signal
} from '@angular/core';

import { AppearanceApiService } from '@core/services/appearance-api.service';

export interface RealBrideMoment {
  id: string;
  name: string;
  quote: string;
  venue: string;
  image: string;
  span: 'tall' | 'wide' | 'square';
}

@Component({
  selector: 'app-real-brides',
  standalone: true,
  imports: [],
  templateUrl: './real-brides.component.html',
  styleUrls: ['./real-brides.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RealBridesComponent implements OnDestroy {
  private readonly appearance = inject(AppearanceApiService);
  readonly activeIndex = signal<number | null>(null);
  readonly theaterOpen = signal(false);

  private readonly defaultMoments: RealBrideMoment[] = [
    {
      id: '1',
      name: 'سارا م.',
      quote: 'عروس زیبای ما در عمارت؛ لحظه‌ای که لباس اروپایی با نور طلایی یکی شد.',
      venue: 'عمارت نیاوران',
      image: 'assets/images/home-hero-bride.webp',
      span: 'tall'
    },
    {
      id: '2',
      name: 'نیکا ر.',
      quote: 'تاج و تور، درست همان‌طور که در پرو VIP تصور کرده بودم.',
      venue: 'تالار باغ‌گل',
      image: 'assets/images/bridal-hair-accessories.webp',
      span: 'square'
    },
    {
      id: '3',
      name: 'مریم ک.',
      quote: 'از کت‌وشلوار عقد تا آخرین جزئیات — همه‌چیز هماهنگ و ماندگار.',
      venue: 'خانه عقد سعدی',
      image: 'assets/images/cat-bridal-clothing.webp',
      span: 'wide'
    },
    {
      id: '4',
      name: 'هستی پ.',
      quote: 'زیورآلات و حجاب مو، تکمیل‌کننده رویای سفید من بودند.',
      venue: 'عمارت فرشته',
      image: 'assets/images/cat-jewelry.webp',
      span: 'square'
    },
    {
      id: '5',
      name: 'آیدا ش.',
      quote: 'تور بلند و کفش درخشان؛ قدم‌هایی که تا همیشه به یاد می‌مانند.',
      venue: 'باغ‌سرای شمیران',
      image: 'assets/images/cat-veil.webp',
      span: 'tall'
    },
    {
      id: '6',
      name: 'یاسمن ف.',
      quote: 'دسته‌گل و اکسسوری خاص — جزئیاتی که استایلم را کامل کردند.',
      venue: 'تالار الماس',
      image: 'assets/images/cat-bouquet.webp',
      span: 'square'
    }
  ];

  get moments(): RealBrideMoment[] {
    const configured = this.appearance.appearance()?.memories
      ?.filter(item => item.active && item.image)
      .map(item => ({ ...item } as RealBrideMoment));
    return configured?.length ? configured : [];
  }

  constructor() {
    // Kept only as a migration reference; published memories are API-only.
    void this.defaultMoments;
    this.appearance.load();
  }

  readonly activeMoment = computed(() => {
    const i = this.activeIndex();
    return i === null ? null : this.moments[i] ?? null;
  });

  openTheater(index: number): void {
    this.activeIndex.set(index);
    this.theaterOpen.set(true);
    document.body.style.overflow = 'hidden';
  }

  closeTheater(): void {
    this.theaterOpen.set(false);
    setTimeout(() => {
      this.activeIndex.set(null);
      document.body.style.overflow = '';
    }, 320);
  }

  next(): void {
    const i = this.activeIndex();
    if (i === null) return;
    this.activeIndex.set((i + 1) % this.moments.length);
  }

  prev(): void {
    const i = this.activeIndex();
    if (i === null) return;
    this.activeIndex.set((i - 1 + this.moments.length) % this.moments.length);
  }

  hideBrokenImage(event: Event): void {
    (event.currentTarget as HTMLImageElement).hidden = true;
  }

  @HostListener('document:keydown', ['$event'])
  onKeydown(event: KeyboardEvent): void {
    if (!this.theaterOpen()) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      this.closeTheater();
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault();
      this.next();
    } else if (event.key === 'ArrowRight') {
      event.preventDefault();
      this.prev();
    }
  }

  ngOnDestroy(): void {
    document.body.style.overflow = '';
  }
}
