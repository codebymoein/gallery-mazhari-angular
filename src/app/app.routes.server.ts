import { RenderMode, type ServerRoute } from '@angular/ssr';

const PUBLIC_SERVER_ROUTES = [
  '',
  'discounts',
  'catalog',
  'accessories',
  'collections/:slug',
  'shop/:slug/:subSlug',
  'shop/:slug',
  'product/:id',
  'looks',
  'look/:id',
  'contact',
  'consultation',
  'home-trial',
  'custom-request/:type'
] as const;

const PRIVATE_CLIENT_ROUTES = [
  'cart',
  'checkout',
  'orders',
  'dream-canvas',
  'catalog-builder',
  'account',
  'admin/**'
] as const;

export const serverRoutes: ServerRoute[] = [
  ...PUBLIC_SERVER_ROUTES.map((path) => ({
    path,
    renderMode: RenderMode.Server
  })),
  ...PRIVATE_CLIENT_ROUTES.map((path) => ({
    path,
    renderMode: RenderMode.Client,
    headers: {
      'X-Robots-Tag': 'noindex, nofollow'
    }
  })),
  {
    path: '**',
    renderMode: RenderMode.Server,
    status: 404,
    headers: {
      'X-Robots-Tag': 'noindex, nofollow'
    }
  }
];
