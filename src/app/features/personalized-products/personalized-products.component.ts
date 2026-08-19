import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

interface PersonalizedProduct {
  title: string;
  description: string;
  route?: string;
}

@Component({
  selector: 'app-personalized-products',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './personalized-products.component.html',
  styleUrl: './personalized-products.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PersonalizedProductsComponent {
  readonly products: PersonalizedProduct[] = [
    { title: 'لباس عروس سفارشی', description: 'ثبت درخواست در فرم موجود طراحی لباس سفارشی.', route: '/custom-request/dress' },
    { title: 'کت شلوار سفارشی', description: 'مسیر ثبت درخواست این محصول هنوز فعال نیست.' },
    { title: 'لباس نامزدی سفارشی', description: 'ثبت درخواست در فرم موجود طراحی لباس سفارشی.', route: '/custom-request/dress' },
    { title: 'تورسر سفارشی', description: 'ثبت درخواست در فرم اختصاصی تورسر سفارشی.', route: '/custom-request/veil' },
    { title: 'دسته گل سفارشی', description: 'مسیر ثبت درخواست این محصول هنوز فعال نیست.' },
    { title: 'هنگر با حک اسم', description: 'مسیر ثبت درخواست این محصول هنوز فعال نیست.' }
  ];
}
