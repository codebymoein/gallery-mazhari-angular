import { ChangeDetectionStrategy, Component } from '@angular/core';

import { RouterLink } from '@angular/router';

interface GuideOption {
  id: string;
  label: string;
  tip: string;
}

interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

@Component({
  selector: 'app-interactive-guide-faq',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './interactive-guide-faq.component.html',
  styleUrls: ['./interactive-guide-faq.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class InteractiveGuideFaqComponent {
  readonly bodyShapes: GuideOption[] = [
    {
      id: 'hourglass',
      label: 'ساعت شنی (Hourglass)',
      tip: 'مدل‌های ماهی و لباس‌هایی که کمر را مشخص می‌کنند، بهترین انتخاب برای فرم ساعت شنی هستند.'
    },
    {
      id: 'pear',
      label: 'گلابی (Pear)',
      tip: 'مدل‌های A-line و دامن پف‌دار تعادل زیبایی به بالاتنه می‌بخشند و پایین‌تنه را نرم نشان می‌دهند.'
    },
    {
      id: 'apple',
      label: 'سیب (Apple)',
      tip: 'یقه V، امپایر و لباس‌هایی با جزئیات روی شانه و یقه، توجه را به سمت بالا می‌کشند.'
    },
    {
      id: 'rectangle',
      label: 'مستطیل (Rectangle)',
      tip: 'کمربند مشخص، چین‌های نرم و مدل‌های پرنسسی منحنی‌های ظریف و زنانه می‌سازند.'
    },
    {
      id: 'inverted-triangle',
      label: 'مثلث معکوس',
      tip: 'دامن‌های پرحجم و جزئیات پایین لباس، تعادل خوش‌فرمی بین شانه و پایین‌تنه ایجاد می‌کنند.'
    },
    {
      id: 'oval',
      label: 'بیضی / گرد',
      tip: 'خطوط عمودی، شکاف‌های ظریف و پارچه‌های روان فرم را کشیده‌تر و متعادل‌تر نشان می‌دهند.'
    }
  ];

  readonly faceShapes: GuideOption[] = [
    {
      id: 'oval-face',
      label: 'صورت بیضی',
      tip: 'تقریباً همه تاج‌ها مناسب‌اند؛ تاج‌های ظریف و کلاسیک چهره را متشخص‌تر می‌کنند.'
    },
    {
      id: 'round-face',
      label: 'صورت گرد',
      tip: 'تاج‌های بلند، شاخه‌ای و زاویه‌دار ارتفاع ایجاد می‌کنند و صورت را کشیده‌تر نشان می‌دهند.'
    },
    {
      id: 'square-face',
      label: 'صورت مربعی',
      tip: 'تاج‌های نرم، منحنی و مرواریدی گوشه‌های صورت را متعادل و لطیف می‌کنند.'
    },
    {
      id: 'heart-face',
      label: 'صورت قلبی',
      tip: 'تاج‌های جانبی، شانه و تورهای کوتاه تعادل زیبایی بین پیشانی و چانه می‌سازند.'
    },
    {
      id: 'long-face',
      label: 'صورت کشیده',
      tip: 'تاج‌های پهن، هاله‌ای و افقی عرض صورت را متعادل می‌کنند.'
    },
    {
      id: 'diamond-face',
      label: 'صورت لوزی',
      tip: 'تاج‌های متوسط با جزئیات روی پیشانی و گونه‌ها، زاویه‌های صورت را نرم می‌کنند.'
    }
  ];

  readonly faqs: FaqItem[] = [
    {
      id: 'pricing',
      question: 'هزینه مشاوره و پرو چقدر است؟',
      answer:
        'جلسه مشاوره تخصصی در گالری مظهری رایگان است. هزینه نهایی لباس یا اکسسوری پس از انتخاب مدل، پارچه و تغییرات سفارشی اعلام می‌شود.'
    },
    {
      id: 'fitting-time',
      question: 'هر جلسه مشاوره چقدر زمان می‌برد؟',
      answer:
        'معمولاً ۴۵ تا ۹۰ دقیقه؛ زمان کافی برای دیدن چند مدل، هماهنگی استایل و پاسخ به سوالات شما.'
    },
    {
      id: 'alterations',
      question: 'آیا امکان تغییر سایز و دوخت مجدد وجود دارد؟',
      answer:
        'بله. سفارشی‌سازی سایز، قد، آستین و جزئیات تزیینی بخشی از خدمات ماست و تا روز مراسم همراه شما هستیم.'
    },
    {
      id: 'booking',
      question: 'چطور وقت مشاوره رزرو کنم؟',
      answer:
        'از فرم «رزرو مشاوره حرفه‌ای» در سایت، یا تماس با شعب سعدی و خانه عروس استفاده کنید. تیم ما برای هماهنگی زمان با شما تماس می‌گیرد.'
    },
    {
      id: 'when-to-buy',
      question: 'چند ماه قبل از عروسی لباس تهیه کنیم؟',
      answer:
        'ایده‌آل ۶ تا ۹ ماه قبل است تا فرصت کافی برای انتخاب، پرو و تنظیمات نهایی داشته باشید. برای اکسسوری معمولاً ۱ تا ۳ ماه کافی است.'
    },
    {
      id: 'accessories',
      question: 'آیا تاج، تور و کفش هم موجود است؟',
      answer:
        'بله. فروشگاه اکسسوری شامل تاج، تور، زیورآلات، کفش، کیف و جزئیات مراسم است و می‌توانید آنلاین سفارش دهید یا در مشاوره هماهنگ کنید.'
    },
    {
      id: 'shipping',
      question: 'ارسال سفارش‌های آنلاین چگونه است؟',
      answer:
        'سفارش‌های اکسسوری پس از تأیید، با بسته‌بندی امن ارسال می‌شوند. زمان تقریبی ارسال و هزینه در مرحله تسویه حساب نمایش داده می‌شود.'
    },
    {
      id: 'return',
      question: 'شرایط مرجوعی و تعویض چیست؟',
      answer:
        'اکسسوری‌های استفاده‌نشده در شرایط خاص قابل بررسی هستند. لباس‌های سفارشی معمولاً غیرقابل مرجوعی‌اند؛ جزئیات هنگام خرید اعلام می‌شود.'
    },
    {
      id: 'budget',
      question: 'آیا امکان خرید اقساطی یا رزرو با بیعانه وجود دارد؟',
      answer:
        'برای برخی مدل‌ها امکان رزرو با بیعانه و برنامه‌ریزی پرداخت وجود دارد. جزئیات را در مشاوره حضوری یا تلفنی بپرسید.'
    },
    {
      id: 'guests',
      question: 'آیا می‌توانم همراه با خانواده برای مشاوره بیایم؟',
      answer:
        'بله. همراهی نزدیکان بلامانع است؛ برای آرامش بیشتر پیشنهاد می‌کنیم تعداد همراهان را محدود نگه دارید.'
    },
    {
      id: 'style',
      question: 'اگر هنوز استایل مشخصی ندارم چه کنم؟',
      answer:
        'نگران نباشید. مشاوران ما با پرسش درباره فرم بدن، فصل مراسم، سلیقه و الهام‌های شما، چند مسیر استایل پیشنهاد می‌دهند.'
    },
    {
      id: 'branches',
      question: 'کدام شعبه برای من مناسب‌تر است؟',
      answer:
        'شعبه سعدی نزدیک مترو سعدی است؛ شعبه خانه عروس از مترو تئاتر شهر در دسترس است. جزئیات مسیر در صفحه «ارتباط با ما» آمده است.'
    }
  ];

  selectedShapeId: string | null = null;
  selectedFaceId: string | null = null;

  get selectedTip(): string | null {
    if (!this.selectedShapeId) {
      return null;
    }
    return this.bodyShapes.find(s => s.id === this.selectedShapeId)?.tip ?? null;
  }

  get selectedFaceTip(): string | null {
    if (!this.selectedFaceId) {
      return null;
    }
    return this.faceShapes.find(s => s.id === this.selectedFaceId)?.tip ?? null;
  }

  selectShape(id: string): void {
    this.selectedShapeId = this.selectedShapeId === id ? null : id;
  }

  selectFace(id: string): void {
    this.selectedFaceId = this.selectedFaceId === id ? null : id;
  }

  isSelected(id: string): boolean {
    return this.selectedShapeId === id;
  }

  isFaceSelected(id: string): boolean {
    return this.selectedFaceId === id;
  }
}
