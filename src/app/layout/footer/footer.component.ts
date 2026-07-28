import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

export interface SocialLink {
  id: 'telegram' | 'whatsapp' | 'bale';
  label: string;
  href: string;
}

export interface SupportChannel {
  id: string;
  label: string;
  phone: string;
  phoneDisplay: string;
  socials: SocialLink[];
}

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.css']
})
export class FooterComponent {
  currentYear = new Date().getFullYear();

  /** Mobile accordion: which section is open (null = all collapsed). */
  openSection: string | null = null;

  branches = [
    {
      id: 'saadi',
      name: 'شعبه سعدی',
      address: 'خیابان سعدی، چهارراه مخبرالدوله، روبه‌روی مترو سعدی، کوچه رفاهی، پلاک ۱۶',
      phone: '+982133961455',
      phoneDisplay: '021 3396 1455',
      googleMaps: 'https://maps.app.goo.gl/9fa53PgVd72SQFCL7',
      neshan: 'https://nshn.ir/91rbvgQ6NxiuH_'
    },
    {
      id: 'bride-house',
      name: 'شعبه خانه عروس',
      address: 'چهارراه امیراکرم، ابتدای خیابان لبافی‌نژاد، پلاک ۱، خانه عروس ایران',
      phone: '+982166459476',
      phoneDisplay: '021 6645 9476',
      googleMaps: 'https://maps.app.goo.gl/vYe9QNMD8gygJM336',
      neshan: 'https://nshn.ir/05rbvgtjVxO6l_'
    }
  ];

  /** Social hrefs are placeholders — replace when real links are provided. */
  supportChannels: SupportChannel[] = [
    {
      id: 'online-support',
      label: 'فروش آنلاین و پشتیبانی',
      phone: '+989352181200',
      phoneDisplay: '0935 218 1200',
      socials: [
        { id: 'telegram', label: 'تلگرام', href: 'https://t.me/' },
        { id: 'whatsapp', label: 'واتساپ', href: 'https://wa.me/989352181200' },
        { id: 'bale', label: 'بله', href: '/contact' }
      ]
    },
    {
      id: 'wholesale',
      label: 'عمده‌فروشی و همکاری',
      phone: '+989373333150',
      phoneDisplay: '0937 333 3150',
      socials: [
        { id: 'telegram', label: 'تلگرام', href: 'https://t.me/' },
        { id: 'whatsapp', label: 'واتساپ', href: 'https://wa.me/989373333150' },
        { id: 'bale', label: 'بله', href: '/contact' }
      ]
    }
  ];

  quickLinks: Array<{
    label: string;
    route: string;
    params: Record<string, string> | null;
    fragment?: string;
  }> = [
    { label: 'فروشگاه اکسسوری', route: '/catalog', params: null },
    { label: 'کالکشن لباس عروس', route: '/collections/bridal-clothing', params: null },
    { label: 'رزرو مشاوره حرفه‌ای', route: '/', params: null, fragment: 'appointment' },
    { label: 'کاتالوگ اختصاصی', route: '/catalog-builder', params: null },
    { label: 'ارتباط با ما', route: '/contact', params: null },
    { label: 'درخواست مشاوره', route: '/consultation', params: null },
    { label: 'سبد خرید', route: '/cart', params: null },
    { label: 'پیگیری سفارش', route: '/orders', params: null }
  ];

  toggleSection(id: string): void {
    this.openSection = this.openSection === id ? null : id;
  }

  isSectionOpen(id: string): boolean {
    return this.openSection === id;
  }

  scrollTop(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  onSocialClick(event: Event, href: string): void {
    if (!href || href === '#') {
      event.preventDefault();
    }
  }
}
