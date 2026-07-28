import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';

interface TrustCard {
  id: string;
  title: string;
  subtitle: string;
  icon: 'custom' | 'guarantee' | 'vip';
}

@Component({
  selector: 'app-trust-guarantees',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './trust-guarantees.component.html',
  styleUrls: ['./trust-guarantees.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TrustGuaranteesComponent {
  readonly cards: TrustCard[] = [
    {
      id: 'customization',
      title: 'سفارشی‌سازی اختصاصی',
      subtitle: 'تغییر و تطابق کامل لباس با سلیقه و سایز دقیق شما.',
      icon: 'custom'
    },
    {
      id: 'zero-stress',
      title: 'گارانتی استرس صفر',
      subtitle: 'همراهی قدم‌به‌قدم مشاوران ما از لحظه انتخاب تا روز مراسم.',
      icon: 'guarantee'
    },
    {
      id: 'expert-consult',
      title: 'مشاوره تخصصی استایل',
      subtitle: 'راهنمایی حرفه‌ای برای هماهنگی لباس، تاج و اکسسوری با فرم بدن و مراسم شما.',
      icon: 'vip'
    }
  ];
}
