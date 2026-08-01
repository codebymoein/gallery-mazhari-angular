import {
  ChangeDetectionStrategy,
  Component,
  HostListener,
  OnDestroy,
  OnInit,
  computed,
  inject,
  signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  NavigationEnd,
  Router,
  RouterLink,
  RouterLinkActive,
  RouterOutlet
} from '@angular/router';
import { Subscription, filter } from 'rxjs';
import { AdminAuthService } from '@core/services/admin-auth.service';
import { StagingQueueService } from '@core/services/staging-queue.service';
import { AdminOrdersService } from '@core/services/admin-orders.service';
import { AdminInventoryService } from '@core/services/admin-inventory.service';
import { AdminMarketingService } from '@core/services/admin-marketing.service';

interface NavItem {
  label: string;
  path: string;
  icon: string;
  managerOnly?: boolean;
  badge?: 'pending' | 'approval' | 'orders' | 'carts' | 'low';
  group?: string;
  keywords?: string;
  permission?: string;
}

@Component({
  selector: 'app-admin-shell',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './admin-shell.component.html',
  styleUrls: ['./admin-shell.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdminShellComponent implements OnInit, OnDestroy {
  private readonly auth = inject(AdminAuthService);
  private readonly router = inject(Router);
  readonly queue = inject(StagingQueueService);
  private readonly orders = inject(AdminOrdersService);
  private readonly inventory = inject(AdminInventoryService);
  private readonly marketing = inject(AdminMarketingService);

  private sub?: Subscription;
  private clock?: ReturnType<typeof setInterval>;

  readonly user = this.auth.user;
  readonly isManager = this.auth.isManager;
  readonly sidebarOpen = signal(false);
  readonly collapsed = signal(false);
  /** side = desktop push layout; over = mobile overlay drawer */
  readonly sidenavMode = signal<'side' | 'over'>(
    typeof window !== 'undefined' && window.innerWidth <= 1200 ? 'over' : 'side'
  );
  readonly pageTitle = signal('مرکز فرماندهی');
  readonly breadcrumb = signal('تحلیل');
  readonly nowLabel = signal(this.formatNow());
  readonly navQuery = signal('');

  readonly navItems: NavItem[] = [
    {
      label: 'مرکز فرماندهی',
      path: '/admin/dashboard',
      icon: 'home',
      group: 'تحلیل',
      keywords: 'dashboard analytics داشبورد'
      ,permission: 'dashboard.view'
    },
    {
      label: 'کانبان سفارش‌ها',
      path: '/admin/orders',
      icon: 'kanban',
      badge: 'orders',
      group: 'فروش',
      keywords: 'orders kanban سفارش پرو'
      ,permission: 'orders.manage'
    },
    {
      label: 'مشتریان CRM',
      path: '/admin/crm',
      icon: 'users',
      group: 'فروش',
      keywords: 'crm مشتری ltv'
      ,permission: 'crm.manage'
    },
    {
      label: 'هاب انبار',
      path: '/admin/inventory',
      icon: 'box',
      badge: 'low',
      group: 'انبار',
      keywords: 'inventory انبار موجودی'
      ,permission: 'inventory.manage'
    },
    {
      label: 'بارگذاری فایل موجودی',
      path: '/admin/import',
      icon: 'upload',
      group: 'انبار',
      keywords: 'excel import تگ انبار موجودی'
      ,permission: 'inventory.manage'
    },
    {
      label: 'پلتفرم هوشمند',
      path: '/admin/platform',
      icon: 'spark',
      group: 'انبار',
      keywords: 'platform dry-run media rules merchandising واردات تصویر پیشنهاد'
      ,permission: 'inventory.manage'
    },
    {
      label: 'کالاهای منتشر شده',
      path: '/admin/published-products',
      icon: 'box',
      group: 'انبار',
      keywords: 'محصول کالا جستجو ویرایش published products'
      ,permission: 'publishing.published.manage'
    },
    {
      label: 'صف انتشار',
      path: '/admin/staging',
      icon: 'camera',
      badge: 'pending',
      group: 'انبار',
      keywords: 'staging عکس دسته بندی انتشار'
      ,permission: 'publishing.queue.manage'
    },
    {
      label: 'تایید نهایی',
      path: '/admin/manager',
      icon: 'check',
      managerOnly: true,
      badge: 'approval',
      group: 'انبار',
      keywords: 'publish تایید مدیر'
    },
    {
      label: 'بازاریابی',
      path: '/admin/marketing',
      icon: 'megaphone',
      badge: 'carts',
      group: 'رشد',
      keywords: 'marketing promo تخفیف سبد'
      ,permission: 'marketing.manage'
    },
    {
      label: 'مرکز مدیریت سایت',
      path: '/admin/appearance',
      icon: 'camera',
      group: 'رشد',
      keywords: 'appearance banner hero category image payment notification style مدیریت سایت ظاهر بنر تصویر پرداخت اعلان استایل',
      permission: 'marketing.manage'
    },
    {
      label: 'مدیریت کاربران',
      path: '/admin/users',
      icon: 'users',
      managerOnly: true,
      group: 'نظارت',
      keywords: 'user manager client access permission کاربر کلاینت دسترسی'
    },
    {
      label: 'لاگ حسابرسی',
      path: '/admin/activity',
      icon: 'shield',
      managerOnly: true,
      group: 'نظارت',
      keywords: 'audit log فعالیت'
    },
    {
      label: 'درخواست‌های مشاوره',
      path: '/admin/client-insights',
      icon: 'users',
      group: 'فروش',
      keywords: 'consultation requests درخواست مشاوره تماس تلفنی'
      ,permission: 'consultation.manage'
    }
    ,{
      label: 'درخواست‌های سفارشی',
      path: '/admin/custom-requests',
      icon: 'camera',
      group: 'فروش',
      keywords: 'custom veil dress درخواست تور سفارشی لباس سفارشی',
      permission: 'consultation.manage'
    }
  ];

  readonly visibleNav = computed(() => {
    const q = this.navQuery().trim().toLowerCase();
    return this.navItems.filter((i) => {
      if (i.managerOnly && !this.isManager()) return false;
      const session = this.user();
      if (session?.role === 'staff' && i.permission && !(session.permissions || []).includes(i.permission)) return false;
      if (!q) return true;
      const hay = `${i.label} ${i.path} ${i.keywords || ''}`.toLowerCase();
      return hay.includes(q);
    });
  });

  readonly navGroups = computed(() => {
    const groups: { name: string; items: NavItem[] }[] = [];
    for (const item of this.visibleNav()) {
      const name = item.group || 'سایر';
      let g = groups.find((x) => x.name === name);
      if (!g) {
        g = { name, items: [] };
        groups.push(g);
      }
      g.items.push(item);
    }
    return groups;
  });

  ngOnInit(): void {
    this.updateSidenavMode();
    this.syncFromUrl(this.router.url);
    this.sub = this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe((e) => {
        this.syncFromUrl(e.urlAfterRedirects);
        this.sidebarOpen.set(false);
        this.navQuery.set('');
      });
    this.clock = setInterval(() => this.nowLabel.set(this.formatNow()), 30000);
  }

  @HostListener('window:resize')
  onResize(): void {
    this.updateSidenavMode();
  }

  private updateSidenavMode(): void {
    const next = window.innerWidth <= 1200 ? 'over' : 'side';
    if (this.sidenavMode() !== next) {
      this.sidenavMode.set(next);
      if (next === 'side') this.sidebarOpen.set(false);
    }
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
    if (this.clock) clearInterval(this.clock);
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.sidebarOpen.set(false);
  }

  toggleSidebar(): void {
    this.sidebarOpen.update((v) => !v);
  }

  toggleCollapsed(): void {
    this.collapsed.update((v) => !v);
  }

  onNavSearch(value: string): void {
    this.navQuery.set(value);
  }

  logout(): void {
    this.auth.logout();
    void this.router.navigateByUrl('/admin/login');
  }

  roleLabel(): string {
    return this.user()?.role === 'manager' ? 'مدیر (مالک)' : 'کارشناس / ادمین';
  }

  initials(): string {
    return (this.user()?.displayName || 'ک').trim().slice(0, 1);
  }

  badgeCount(kind?: NavItem['badge']): number {
    if (kind === 'pending') return this.queue.pendingItems().length;
    if (kind === 'approval') return this.queue.readyForApproval().length;
    if (kind === 'orders') {
      return this.orders.orders().filter((o) => o.stage === 'new' || o.stage === 'fitting')
        .length;
    }
    if (kind === 'carts') return this.marketing.abandonedCarts().length;
    if (kind === 'low') return this.inventory.lowStockCount();
    return 0;
  }

  isCrmActive(): boolean {
    return this.router.url.startsWith('/admin/crm');
  }

  private syncFromUrl(url: string): void {
    const path = url.split('?')[0];
    const map: Record<string, { title: string; crumb: string }> = {
      '/admin/dashboard': { title: 'مرکز فرماندهی', crumb: 'تحلیل' },
      '/admin/orders': { title: 'کانبان سفارش عروس', crumb: 'فروش' },
      '/admin/crm': { title: 'هوشمندی مشتریان', crumb: 'CRM' },
      '/admin/inventory': { title: 'هاب انبار و دسته‌بندی', crumb: 'انبار' },
      '/admin/inventory/category': { title: 'محصولات دسته', crumb: 'انبار' },
      '/admin/import': { title: 'بارگذاری فایل موجودی انبار', crumb: 'انبار' },
      '/admin/platform': { title: 'پلتفرم هوشمند واردات', crumb: 'انبار' },
      '/admin/staging': { title: 'صف انتشار — دسته‌بندی سایت', crumb: 'انبار' },
      '/admin/manager': { title: 'تایید نهایی مدیر', crumb: 'انبار' },
      '/admin/marketing': { title: 'بازاریابی و بازگشت', crumb: 'رشد' },
      '/admin/appearance': { title: 'مرکز مدیریت سایت', crumb: 'رشد' },
      '/admin/activity': { title: 'لاگ حسابرسی', crumb: 'نظارت' },
      '/admin/client-insights': { title: 'درخواست‌های مشاوره', crumb: 'فروش' },
      '/admin/users': { title: 'مدیریت کاربران و کلاینت‌ها', crumb: 'نظارت' }
    };
    const hit = Object.entries(map)
      .sort((a, b) => b[0].length - a[0].length)
      .find(([key]) => path.startsWith(key));
    if (hit) {
      this.pageTitle.set(hit[1].title);
      this.breadcrumb.set(hit[1].crumb);
    }
  }

  private formatNow(): string {
    try {
      return new Intl.DateTimeFormat('fa-IR', {
        weekday: 'long',
        hour: '2-digit',
        minute: '2-digit'
      }).format(new Date());
    } catch {
      return '';
    }
  }
}
