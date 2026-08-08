import { Routes } from '@angular/router';
import {
  adminAuthGuard,
  adminGuestGuard,
  adminPermissionGuard,
  managerRoleGuard
} from './core/guards/admin-auth.guard';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    data: {
      seo: {
        title: 'گالری مظهری | لباس عروس و اکسسوری عروس',
        description: 'مشاهده کالکشن لباس عروس، خرید اکسسوری عروس و رزرو مشاوره تخصصی و وقت پرو در گالری مظهری.',
        imageAlt: 'کالکشن لباس عروس گالری مظهری'
      }
    },
    loadComponent: () => import('./features/home/home.component').then(m => m.HomeComponent)
  },
  {
    path: 'discounts',
    data: {
      seo: {
        title: 'محصولات تخفیف‌دار | گالری مظهری',
        description: 'مشاهده همه محصولات دارای تخفیف فعال در گالری مظهری.'
      }
    },
    loadComponent: () =>
      import('./features/discounts/discounts-page.component').then(m => m.DiscountsPageComponent)
  },
  {
    path: 'catalog',
    data: {
      seo: {
        title: 'فروشگاه لباس و اکسسوری عروس | گالری مظهری',
        description: 'خرید و مشاهده مجموعه لباس عروس، تاج، تور، زیورآلات، کفش، کیف و اکسسوری عروس از گالری مظهری.'
      }
    },
    loadComponent: () => import('./features/catalog/catalog.component').then(m => m.CatalogComponent)
  },
  {
    path: 'accessories',
    data: {
      seo: {
        title: 'فروشگاه اکسسوری عروس | گالری مظهری',
        description: 'تمام دسته‌بندی‌های اکسسوری عروس؛ تاج، تور، زیورآلات، کفش، کیف و ملزومات مراسم.'
      }
    },
    loadComponent: () =>
      import('./features/accessory-store/accessory-store.component').then(
        m => m.AccessoryStoreComponent
      )
  },
  {
    path: 'collections/:slug',
    data: {
      seo: {
        title: 'کالکشن لباس عروس | گالری مظهری',
        description: 'مشاهده کالکشن‌های اختصاصی لباس عروس شامل عربی، اروپایی، ماهی و نامزدی در گالری مظهری.'
      }
    },
    loadComponent: () =>
      import('./features/collection-page/collection-page.component').then(
        m => m.CollectionPageComponent
      )
  },
  {
    path: 'shop/:slug/:subSlug',
    data: {
      seo: {
        title: 'محصولات دسته‌بندی | گالری مظهری',
        description: 'مشاهده محصولات زیردسته انتخابی در فروشگاه گالری مظهری.'
      }
    },
    loadComponent: () =>
      import('./features/category-products/category-products.component').then(
        m => m.CategoryProductsComponent
      )
  },
  {
    path: 'shop/:slug',
    data: {
      seo: {
        title: 'دسته‌بندی فروشگاه | گالری مظهری',
        description: 'مشاهده زیردسته‌ها و محصولات لوکس گالری مظهری.'
      }
    },
    loadComponent: () =>
      import('./features/category-hub/category-hub.component').then(m => m.CategoryHubComponent)
  },
  {
    path: 'product/:id',
    data: {
      seo: {
        title: 'جزئیات لباس عروس | گالری مظهری',
        description: 'مشاهده جزئیات، فرم، پارچه و توضیحات کامل لباس عروس در گالری مظهری.'
      }
    },
    loadComponent: () => import('./features/product-detail/product-detail.component').then(m => m.ProductDetailComponent)
  },
  {
    path: 'looks',
    data: {
      seo: {
        title: 'استایل‌های عروس | گالری مظهری',
        description: 'مشاهده استایل‌ها و ترکیب‌های منتخب لباس و اکسسوری عروس در گالری مظهری.'
      }
    },
    loadComponent: () => import('./features/looks/looks.component').then(m => m.LooksComponent)
  },
  {
    path: 'look/:id',
    loadComponent: () => import('./features/look-detail/look-detail.component').then(m => m.LookDetailComponent)
  },
  {
    path: 'cart',
    data: {
      seo: {
        title: 'سبد خرید | گالری مظهری',
        description: 'مدیریت محصولات انتخاب‌شده در سبد خرید گالری مظهری.',
        robots: 'noindex,nofollow'
      }
    },
    loadComponent: () => import('./features/cart/cart.component').then(m => m.CartComponent)
  },
  {
    path: 'checkout',
    data: {
      seo: {
        title: 'تسویه حساب | گالری مظهری',
        description: 'تکمیل آدرس، ارسال و خلاصه سفارش پیش از ورود به درگاه بانکی.',
        robots: 'noindex,nofollow'
      }
    },
    loadComponent: () => import('./features/checkout/checkout.component').then(m => m.CheckoutComponent)
  },
  {
    path: 'orders',
    data: {
      seo: {
        title: 'پیگیری سفارش‌ها | گالری مظهری',
        description: 'مشاهده وضعیت و جزئیات سفارش‌های شما در گالری مظهری.',
        robots: 'noindex,nofollow'
      }
    },
    loadComponent: () => import('./features/orders/orders.component').then(m => m.OrdersComponent)
  },
  {
    path: 'contact',
    data: {
      seo: {
        title: 'ارتباط با ما | گالری مظهری',
        description: 'آدرس شعب سعدی و خانه عروس، مسیر مترو، ساعات کاری و راه‌های تماس با گالری مظهری.'
      }
    },
    loadComponent: () => import('./features/contact/contact.component').then(m => m.ContactComponent)
  },
  {
    path: 'dream-canvas',
    data: {
      seo: {
        title: 'بوم رویایی من | گالری مظهری',
        description: 'مجموعه شخصی محصولات و استایل‌های مورد علاقه شما در گالری مظهری.',
        robots: 'noindex,nofollow'
      }
    },
    loadComponent: () => import('./features/dream-canvas/dream-canvas.component').then(m => m.DreamCanvasComponent)
  },
  {
    path: 'catalog-builder',
    data: {
      seo: {
        title: 'کاتالوگ اختصاصی عروس | گالری مظهری',
        description: 'ساخت و اشتراک‌گذاری کاتالوگ شخصی لباس و اکسسوری عروس در گالری مظهری.',
        robots: 'noindex,follow'
      }
    },
    loadComponent: () =>
      import('./features/catalog-builder/catalog-builder.component').then(
        m => m.CatalogBuilderComponent
      )
  },
  {
    path: 'consultation',
    data: {
      seo: {
        title: 'درخواست مشاوره تخصصی | گالری مظهری',
        description: 'برای انتخاب لباس عروس و مشاوره VIP در گالری مظهری، فرم درخواست مشاوره تخصصی را تکمیل کنید.'
      }
    },
    loadComponent: () => import('./features/consultation/consultation.component').then(m => m.ConsultationComponent)
  },
  {
    path: 'home-trial',
    data: { seo: { title: 'تست اکسسوری در محل تهران | گالری مظهری', description: 'انتخاب تا پنج اکسسوری و تست در محل با پیک اختصاصی گالری مظهری.' } },
    loadComponent: () => import('./features/home-trial/home-trial.component').then(m => m.HomeTrialComponent)
  },
  {
    path: 'custom-request/:type',
    data: { seo: { title: 'درخواست طراحی سفارشی | گالری مظهری', description: 'ثبت درخواست تور سر یا لباس سفارشی همراه با تصاویر مدل موردنظر.' } },
    loadComponent: () => import('./features/custom-request/custom-request.component').then(m => m.CustomRequestComponent)
  },
  {
    path: 'account',
    data: {
      seo: {
        title: 'حساب کاربری | گالری مظهری',
        description: 'داشبورد کاربری، علاقه‌مندی‌ها و تنظیمات شخصی گالری مظهری.',
        robots: 'noindex,nofollow'
      }
    },
    loadComponent: () => import('./features/account/account.component').then(m => m.AccountComponent)
  },
  {
    path: 'admin/login',
    data: {
      seo: {
        title: 'ورود پنل مدیریت | گالری مظهری',
        description: 'ورود کارکنان و مدیر به پنل انبار و انتشار محصولات.',
        robots: 'noindex,nofollow'
      }
    },
    canActivate: [adminGuestGuard],
    loadComponent: () =>
      import('./features/admin/admin-login/admin-login.component').then(
        m => m.AdminLoginComponent
      )
  },
  {
    path: 'admin',
    canActivate: [adminAuthGuard],
    loadComponent: () =>
      import('./features/admin/admin-shell/admin-shell.component').then(m => m.AdminShellComponent),
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'dashboard'
      },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/admin/admin-dashboard/admin-dashboard.component').then(
            m => m.AdminDashboardComponent
          )
      },
      {
        path: 'staging',
        canActivate: [adminPermissionGuard('publishing.staging.view')],
        loadComponent: () =>
          import('./features/admin/staging-queue/staging-queue.component').then(
            m => m.StagingQueueComponent
          )
      },
      {
        path: 'published',
        canActivate: [adminPermissionGuard('publishing.published.manage')],
        loadComponent: () =>
          import('./features/admin/published-products/published-products.component').then(
            m => m.PublishedProductsComponent
          )
      },
      {
        path: 'media',
        canActivate: [adminPermissionGuard('media.manage')],
        loadComponent: () =>
          import('./features/admin/media-manager/media-manager.component').then(
            m => m.MediaManagerComponent
          )
      },
      {
        path: 'imports',
        canActivate: [adminPermissionGuard('inventory.import.manage')],
        loadComponent: () =>
          import('./features/admin/import-history/import-history.component').then(
            m => m.ImportHistoryComponent
          )
      },
      {
        path: 'orders',
        canActivate: [adminPermissionGuard('orders.manage')],
        loadComponent: () =>
          import('./features/admin/orders-kanban/orders-kanban.component').then(
            m => m.OrdersKanbanComponent
          )
      },
      {
        path: 'discounts',
        canActivate: [adminPermissionGuard('discounts.manage')],
        loadComponent: () =>
          import('./features/admin/discount-manager/discount-manager.component').then(
            m => m.DiscountManagerComponent
          )
      },
      {
        path: 'appearance',
        canActivate: [adminPermissionGuard('appearance.manage')],
        loadComponent: () =>
          import('./features/admin/appearance-manager/appearance-manager.component').then(
            m => m.AppearanceManagerComponent
          )
      },
      {
        path: 'platform',
        canActivate: [managerRoleGuard],
        loadComponent: () =>
          import('./features/admin/platform-hub/platform-hub.component').then(
            m => m.PlatformHubComponent
          )
      },
      {
        path: 'users',
        canActivate: [managerRoleGuard],
        loadComponent: () =>
          import('./features/admin/user-management/user-management.component').then(
            m => m.UserManagementComponent
          )
      }
    ]
  },
  {
    path: '**',
    data: {
      seo: {
        title: 'صفحه پیدا نشد | گالری مظهری',
        description: 'صفحه موردنظر پیدا نشد. برای ادامه به صفحه اصلی یا فروشگاه گالری مظهری بازگردید.',
        robots: 'noindex,nofollow'
      }
    },
    loadComponent: () => import('./features/not-found/not-found.component').then(m => m.NotFoundComponent)
  }
];
