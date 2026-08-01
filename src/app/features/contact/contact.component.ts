import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

interface Branch {
  id: string;
  name: string;
  address: string;
  phone: string;
  phoneDisplay: string;
  googleMaps: string;
  neshanMaps: string;
  metroHint: string;
  hours: string;
  specialty: string;
}

interface SupportLine {
  id: string;
  label: string;
  phone: string;
  phoneDisplay: string;
}

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './contact.component.html',
  styleUrls: ['./contact.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ContactComponent {
  readonly branches: Branch[] = [
    {
      id: 'bride-house',
      name: 'شعبه خانه عروس',
      address: 'چهارراه امیراکرم، ابتدای خیابان لبافی‌نژاد، پلاک ۱',
      phone: '02166459476',
      phoneDisplay: '021 6645 9476',
      googleMaps: 'https://maps.app.goo.gl/vYe9QNMD8gygJM336',
      neshanMaps: 'https://neshan.org/maps/search/چهارراه%20امیرکرم%20لبافی%20نژاد',
      metroHint: 'دسترسی آسان با مترو تئاتر شهر',
      hours: 'شنبه تا پنجشنبه ۱۰ تا ۲۰ — جمعه و ایام تعطیل ۱۳ تا ۲۰:۳۰',
      specialty: 'انتخاب مناسب برای لباس عروس، کت‌وشلوار و اکسسوری کامل عروس'
    },
    {
      id: 'saadi',
      name: 'شعبه سعدی',
      address: 'خیابان سعدی، چهارراه مخبرالدوله، روبه‌روی مترو سعدی، کوچه رفاهی، پلاک ۱۶',
      phone: '+982133961455',
      phoneDisplay: '021 3396 1455',
      googleMaps: 'https://maps.app.goo.gl/9fa53PgVd72SQFCL7',
      neshanMaps: 'https://neshan.org/maps/search/خیابان%20سعدی%20تهران',
      metroHint: 'دسترسی آسان با مترو سعدی',
      hours: 'شنبه تا پنجشنبه ۱۰ تا ۲۰ — جمعه و ایام تعطیل ۱۳ تا ۲۰:۳۰',
      specialty: 'انتخاب مناسب برای خرید اکسسوری کامل عروس و کت‌وشلوار'
    }
  ];

  readonly supportLines: SupportLine[] = [
    {
      id: 'online',
      label: 'فروش آنلاین و پشتیبانی',
      phone: '09352181200',
      phoneDisplay: '0935 218 1200'
    },
    {
      id: 'wholesale',
      label: 'عمده‌فروشی و همکاری',
      phone: '+989373333150',
      phoneDisplay: '0937 333 3150'
    }
  ];

  whatsappUrl(phone: string): string {
    return `https://wa.me/${this.internationalPhone(phone)}`;
  }

  telegramUrl(phone: string): string {
    return `tg://resolve?phone=${this.internationalPhone(phone)}`;
  }

  baleUrl(phone: string): string {
    return `https://ble.ir/${phone.replace(/\D/g, '').replace(/^98/, '0')}`;
  }

  private internationalPhone(phone: string): string {
    const digits = phone.replace(/\D/g, '');
    return digits.startsWith('98') ? digits : `98${digits.replace(/^0/, '')}`;
  }
}
