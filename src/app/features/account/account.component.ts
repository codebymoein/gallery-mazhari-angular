import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnInit,
  inject
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { combineLatest, map, Observable } from 'rxjs';
import { CartService } from '@core/services/cart.service';
import {
  DreamCanvasItem,
  DreamCanvasService
} from '@core/services/dream-canvas.service';
import { LocalOrder, OrderService } from '@core/services/order.service';
import { ShoppingContextService } from '@core/services/shopping-context.service';
import { WeddingTimelineService } from '@core/services/wedding-timeline.service';
import { environment } from '@env/environment';

interface UserPreferences {
  bodyShape?: string;
  faceShape?: string;
}

interface ActivityItem {
  id: string;
  type: 'order' | 'canvas';
  title: string;
  subtitle: string;
  date: string;
  link?: string;
}

interface QuickLink {
  route: string;
  label: string;
  icon: string;
}

const BODY_LABELS: Record<string, string> = {
  hourglass: 'ساعت شنی',
  pear: 'گلابی',
  apple: 'سیب',
  rectangle: 'مستطیل',
  'inverted-triangle': 'مثلث معکوس',
  oval: 'بیضی / گرد'
};

const FACE_LABELS: Record<string, string> = {
  'oval-face': 'صورت بیضی',
  'round-face': 'صورت گرد',
  'square-face': 'صورت مربعی',
  'heart-face': 'صورت قلبی',
  'long-face': 'صورت کشیده',
  'diamond-face': 'صورت الماسی'
};

@Component({
  selector: 'app-account',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './account.component.html',
  styleUrls: ['./account.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AccountComponent implements OnInit {
  private readonly dreamCanvas = inject(DreamCanvasService);
  private readonly orders = inject(OrderService);
  private readonly timeline = inject(WeddingTimelineService);
  private readonly cart = inject(CartService);
  private readonly shoppingContext = inject(ShoppingContextService);
  private readonly cdr = inject(ChangeDetectorRef);

  readonly likedItems$ = this.dreamCanvas.items$;
  readonly orders$ = this.orders.orders$;
  readonly cartCount$ = this.cart.cartItemCount$;
  readonly timelineState$ = this.timeline.state$;

  activities$!: Observable<ActivityItem[]>;
  prefs: UserPreferences = {};
  referralCode = '';
  copied = false;

  readonly quickLinks: QuickLink[] = [
    { route: '/orders', label: 'پیگیری سفارش‌ها', icon: 'orders' },
    { route: '/cart', label: 'سبد خرید', icon: 'cart' },
    { route: '/dream-canvas', label: 'بوم رویایی', icon: 'canvas' },
    { route: '/consultation', label: 'مشاوره VIP', icon: 'consult' },
    { route: '/checkout', label: 'تسویه حساب', icon: 'checkout' }
  ];

  ngOnInit(): void {
    this.prefs = this.loadPreferences();
    this.referralCode = this.buildReferralCode();
    this.activities$ = combineLatest([
      this.orders.orders$,
      this.dreamCanvas.items$
    ]).pipe(map(([orders, canvasItems]) => this.buildActivities(orders, canvasItems)));
  }

  greeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) return 'صبح بخیر';
    if (hour < 17) return 'ظهر بخیر';
    if (hour < 21) return 'عصر بخیر';
    return 'شب بخیر';
  }

  shopLink(): string[] {
    return this.shoppingContext.continueShoppingLink([]);
  }

  bodyShapeLabel(): string {
    return this.prefs.bodyShape
      ? BODY_LABELS[this.prefs.bodyShape] ?? this.prefs.bodyShape
      : 'ثبت نشده';
  }

  faceShapeLabel(): string {
    return this.prefs.faceShape
      ? FACE_LABELS[this.prefs.faceShape] ?? this.prefs.faceShape
      : 'ثبت نشده';
  }

  formatDate(iso: string): string {
    return new Intl.DateTimeFormat('fa-IR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(new Date(iso));
  }

  formatWeddingDate(date: string | null): string {
    if (!date) return 'ثبت نشده';
    const [y, m, d] = date.split('-').map(Number);
    return new Intl.DateTimeFormat('fa-IR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(new Date(y, m - 1, d));
  }

  formatPrice(amount: number): string {
    return new Intl.NumberFormat('fa-IR').format(Math.round(amount)) + ' ریال';
  }

  async copyReferral(): Promise<void> {
    const text = `گالری مظهری — کد دعوت VIP: ${this.referralCode}\nhttps://gallerymazhari.com/account#referral`;
    try {
      await navigator.clipboard.writeText(text);
      this.copied = true;
      this.cdr.markForCheck();
      setTimeout(() => {
        this.copied = false;
        this.cdr.markForCheck();
      }, 2200);
    } catch {
      this.copied = false;
    }
  }

  trackByProductId(_index: number, item: DreamCanvasItem): number {
    return item.productId;
  }

  trackByActivity(_index: number, item: ActivityItem): string {
    return item.id;
  }

  onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.hidden = true;
  }

  private buildActivities(orders: LocalOrder[], canvasItems: DreamCanvasItem[]): ActivityItem[] {
    const orderActivities: ActivityItem[] = orders.slice(0, 6).map(o => ({
      id: `order-${o.id}`,
      type: 'order',
      title: `سفارش ${o.number}`,
      subtitle: `${this.orders.statusLabel(o.status)} · ${this.formatPrice(o.total)}`,
      date: o.createdAt,
      link: '/orders'
    }));

    const canvasActivities: ActivityItem[] = canvasItems.slice(0, 6).map(item => ({
      id: `canvas-${item.productId}`,
      type: 'canvas',
      title: `افزودن به بوم رویایی`,
      subtitle: item.name,
      date: item.addedAt,
      link: '/dream-canvas'
    }));

    return [...orderActivities, ...canvasActivities]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 8);
  }

  private loadPreferences(): UserPreferences {
    try {
      const raw = localStorage.getItem(environment.storageKeys.userPreferences);
      if (!raw) return {};
      return JSON.parse(raw) as UserPreferences;
    } catch {
      return {};
    }
  }

  private buildReferralCode(): string {
    try {
      const stored = localStorage.getItem('mazhari_referral_code');
      if (stored) return stored;
      const code = `GM-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
      localStorage.setItem('mazhari_referral_code', code);
      return code;
    } catch {
      return 'GM-VIP';
    }
  }
}
