import { Routes } from '@angular/router';
import {
  adminAuthGuard,
  adminGuestGuard,
  managerRoleGuard
} from './core/guards/admin-auth.guard';
import { CatalogComponent } from './features/catalog/catalog.component';
import { CollectionPageComponent } from './features/collection-page/collection-page.component';

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
    path: 'catalog',
    data: {
      seo: {
        title: 'فروشگاه لباس و اکسسوری عروس | گالری مظهری',
        description: 'خرید و مشاهده مجموعه لباس عروس، تاج، تور، زیورآلات، کفش، کیف و اکسسوری عروس از گالری مظهری.'
      }
    },
    component: CatalogComponent
  },
  {
    path: 'collections/:slug',
    data: {
      seo: {
        title: 'کالکشن لباس عروس | گالری مظهری',
        description: 'مشاهده کالکشن‌های اختصاصی لباس عروس شامل عربی، اروپایی، ماهی و نامزدی در گالری مظهری.'
      }
    },
    component: CollectionPageComponent
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
    redirectTo: 'catalog',
    pathMatch: 'full'
  },
  {
    path: 'look/:id',
    redirectTo: 'catalog',
    pathMatch: 'full'
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
      import('./features/admin/login/admin-login.component').then(
        (m) => m.AdminLoginComponent
      )
  },
  {
    path: 'admin',
    canActivate: [adminAuthGuard],
    data: {
      seo: {
        title: 'پنل مدیریت | گالری مظهری',
        description: 'مدیریت انبار، صف انتشار و تایید نهایی محصولات.',
        robots: 'noindex,nofollow'
      }
    },
    loadComponent: () =>
      import('./features/admin/admin-shell/admin-shell.component').then(
        (m) => m.AdminShellComponent
      ),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      {
        path: 'dashboard',
        data: {
          seo: {
            title: 'مرکز فرماندهی | گالری مظهری',
            robots: 'noindex,nofollow'
          }
        },
        loadComponent: () =>
          import('./features/admin/dashboard/admin-dashboard.component').then(
            (m) => m.AdminDashboardComponent
          )
      },
      {
        path: 'orders',
        data: {
          seo: {
            title: 'کانبان سفارش عروس | گالری مظهری',
            robots: 'noindex,nofollow'
          }
        },
        loadComponent: () =>
          import('./features/admin/orders/orders-kanban.component').then(
            (m) => m.OrdersKanbanComponent
          )
      },
      {
        path: 'crm',
        data: {
          seo: {
            title: 'CRM مشتریان | گالری مظهری',
            robots: 'noindex,nofollow'
          }
        },
        loadComponent: () =>
          import('./features/admin/crm/crm-clients.component').then(
            (m) => m.CrmClientsComponent
          )
      },
      {
        path: 'crm/:id',
        data: {
          seo: {
            title: 'پروفایل مشتری | گالری مظهری',
            robots: 'noindex,nofollow'
          }
        },
        loadComponent: () =>
          import('./features/admin/crm/crm-profile.component').then(
            (m) => m.CrmProfileComponent
          )
      },
      {
        path: 'inventory',
        data: {
          seo: {
            title: 'هاب انبار | گالری مظهری',
            robots: 'noindex,nofollow'
          }
        },
        loadComponent: () =>
          import('./features/admin/inventory/inventory-hub.component').then(
            (m) => m.InventoryHubComponent
          )
      },
      {
        path: 'inventory/category/:slug',
        data: {
          seo: {
            title: 'محصولات دسته | گالری مظهری',
            robots: 'noindex,nofollow'
          }
        },
        loadComponent: () =>
          import('./features/admin/inventory/inventory-category.component').then(
            (m) => m.InventoryCategoryComponent
          )
      },
      {
        path: 'marketing',
        data: {
          seo: {
            title: 'بازاریابی | گالری مظهری',
            robots: 'noindex,nofollow'
          }
        },
        loadComponent: () =>
          import('./features/admin/marketing/marketing-hub.component').then(
            (m) => m.MarketingHubComponent
          )
      },
      {
        path: 'import',
        data: {
          seo: {
            title: 'بارگذاری اکسل انبار | گالری مظهری',
            robots: 'noindex,nofollow'
          }
        },
        loadComponent: () =>
          import('./features/admin/excel-import/excel-import.component').then(
            (m) => m.ExcelImportComponent
          )
      },
      {
        path: 'staging',
        data: {
          seo: {
            title: 'محصولات منتظر انتشار | گالری مظهری',
            robots: 'noindex,nofollow'
          }
        },
        loadComponent: () =>
          import('./features/admin/staging-queue/staging-queue.component').then(
            (m) => m.StagingQueueComponent
          )
      },
      {
        path: 'manager',
        canActivate: [managerRoleGuard],
        data: {
          seo: {
            title: 'تایید نهایی مدیر | گالری مظهری',
            robots: 'noindex,nofollow'
          }
        },
        loadComponent: () =>
          import(
            './features/admin/manager-dashboard/manager-dashboard.component'
          ).then((m) => m.ManagerDashboardComponent)
      },
      {
        path: 'activity',
        canActivate: [managerRoleGuard],
        data: {
          seo: {
            title: 'لاگ حسابرسی | گالری مظهری',
            robots: 'noindex,nofollow'
          }
        },
        loadComponent: () =>
          import('./features/admin/activity/admin-activity.component').then(
            (m) => m.AdminActivityComponent
          )
      },
      {
        path: 'client-insights',
        data: {
          seo: {
            title: 'بینش مشتریان | گالری مظهری',
            description: 'مشاهده بوم رویایی و تاریخ مراسم مشتریان برای آماده‌سازی مشاوره.',
            robots: 'noindex,nofollow'
          }
        },
        loadComponent: () =>
          import('./features/admin/client-insights/client-insights.component').then(
            (m) => m.ClientInsightsComponent
          )
      }
    ]
  },
  {
    path: '**',
    data: {
      seo: {
        title: 'صفحه پیدا نشد | گالری مظهری',
        description: 'صفحه‌ای که به دنبال آن بودید پیدا نشد.',
        robots: 'noindex,nofollow'
      }
    },
    loadComponent: () => import('./features/not-found/not-found.component').then(m => m.NotFoundComponent)
  }
];
