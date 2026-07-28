import {
  Component,
  ChangeDetectionStrategy,
  ElementRef,
  ViewChild,
  signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

export interface LookPackagePiece {
  label: string;
}

export interface LookPackage {
  id: string;
  slug: string;
  title: string;
  style: string;
  mood: string;
  ceremony: string;
  excerpt: string;
  image: string;
  pieces: LookPackagePiece[];
}

@Component({
  selector: 'app-lookbook-matchmaker',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './lookbook-matchmaker.component.html',
  styleUrls: ['./lookbook-matchmaker.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LookbookMatchmakerComponent {
  @ViewChild('track', { static: true }) trackRef!: ElementRef<HTMLElement>;

  readonly canScrollStart = signal(false);
  readonly canScrollEnd = signal(true);

  /** Curated bridal packages — Dress + accessories bundled as complete looks. */
  readonly looks: LookPackage[] = [
    {
      id: '1',
      slug: 'ivory-reverie',
      title: 'رویای عاجی',
      style: 'Timeless European',
      mood: 'لطیف و جاودانه',
      ceremony: 'جشن عروسی و فرمالیته',
      excerpt: 'لباس اروپایی، تور لطیف و جزئیات روشن — زیبایی ماندگار در سادگی.',
      image: 'assets/images/home-hero-bride.webp',
      pieces: [
        { label: 'لباس اروپایی' },
        { label: 'تور سر' },
        { label: 'تاج' },
        { label: 'کفش' }
      ]
    },
    {
      id: '2',
      slug: 'modern-vow',
      title: 'پیمان مدرن',
      style: 'Modern Ceremony',
      mood: 'آرام و معاصر',
      ceremony: 'عقد، محضر و جشن کوچک',
      excerpt: 'کت‌وشلوار عقد با خطوط تمیز، کیف ظریف و زیورآلات مینیمال.',
      image: 'assets/images/cat-bridal-clothing.webp',
      pieces: [
        { label: 'کت‌وشلوار' },
        { label: 'کیف' },
        { label: 'زیورآلات' },
        { label: 'کفش' }
      ]
    },
    {
      id: '3',
      slug: 'golden-harmony',
      title: 'هماهنگی طلایی',
      style: 'Golden Harmony',
      mood: 'گرم و هماهنگ',
      ceremony: 'عروسی کلاسیک و مجلل',
      excerpt: 'تور، تاج، زیورآلات و کیف در یک روایت طلایی منسجم.',
      image: 'assets/images/bridal-hair-accessories.webp',
      pieces: [
        { label: 'تور سر' },
        { label: 'تاج' },
        { label: 'زیورآلات' },
        { label: 'دسته‌گل' }
      ]
    },
    {
      id: '4',
      slug: 'pearl-whisper',
      title: 'نجوای مروارید',
      style: 'Soft Mermaid',
      mood: 'رمانتیک و درخشان',
      ceremony: 'عروسی شب و فرمالیته',
      excerpt: 'مدل ماهی، شنل لطیف، تل مرواریدی و کفش درخشان — یک پکیج کامل.',
      image: 'assets/images/cat-veil.webp',
      pieces: [
        { label: 'مدل ماهی' },
        { label: 'شنل' },
        { label: 'تل' },
        { label: 'کفش' }
      ]
    }
  ];

  hideBrokenImage(event: Event): void {
    (event.currentTarget as HTMLImageElement).hidden = true;
  }

  onTrackScroll(): void {
    const el = this.trackRef?.nativeElement;
    if (!el) return;

    const maxScroll = el.scrollWidth - el.clientWidth;
    if (maxScroll <= 4) {
      this.canScrollStart.set(false);
      this.canScrollEnd.set(false);
      return;
    }

    const pos = Math.abs(el.scrollLeft);
    this.canScrollStart.set(pos > 8);
    this.canScrollEnd.set(pos < maxScroll - 8);
  }

  scroll(direction: 1 | -1): void {
    const el = this.trackRef?.nativeElement;
    if (!el) return;
    const amount = Math.min(el.clientWidth * 0.82, 320);
    // RTL: positive direction advances toward the next cards
    el.scrollBy({ left: direction * -amount, behavior: 'smooth' });
  }
}
