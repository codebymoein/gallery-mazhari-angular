import { Routes } from '@angular/router';

export const plannerRoutes: Routes = [
  {
    path: 'planner',
    data: {
      seo: {
        title: 'برنامه‌ریز مراسم | گالری مظهری',
        description: 'برنامه شخصی مراسم، چک‌لیست عروس و مسیر آماده‌سازی تا روز مراسم در گالری مظهری.',
        robots: 'noindex,nofollow',
      },
    },
    loadComponent: () => import('./planner.component').then((m) => m.PlannerComponent),
  },
];
