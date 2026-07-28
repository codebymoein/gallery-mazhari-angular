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
  metroHint: string;
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
      id: 'saadi',
      name: 'شعبه سعدی',
      address: 'خیابان سعدی، چهارراه مخبرالدوله، روبه‌روی مترو سعدی، کوچه رفاهی، پلاک ۱۶',
      phone: '+982133961455',
      phoneDisplay: '021 3396 1455',
      googleMaps: 'https://maps.app.goo.gl/9fa53PgVd72SQFCL7',
      metroHint: 'دسترسی آسان با مترو سعدی'
    },
    {
      id: 'bride-house',
      name: 'شعبه خانه عروس',
      address: 'چهارراه امیراکرم، ابتدای خیابان لبافی‌نژاد، پلاک ۱',
      phone: '02166459476',
      phoneDisplay: '021 6645 9476',
      googleMaps: 'https://maps.app.goo.gl/vYe9QNMD8gygJM336',
      metroHint: 'دسترسی آسان با مترو تئاتر شهر'
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

}
