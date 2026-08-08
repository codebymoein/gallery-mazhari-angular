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

const publicServerRoutes: ServerRoute[] = PUBLIC_SERVER_ROUTES.map(
  (path): ServerRoute => ({
    path,
    renderMode: RenderMode.Server
  })
);

const privateClientRoutes: ServerRoute[] = PRIVATE_CLIENT_ROUTES.map(
  (path): ServerRoute => ({
    path,
    renderMode: RenderMode.Client,
    headers: {
      'X-Robots-Tag': 'noindex, nofollow'
    }
  })
);

export const serverRoutes: ServerRoute[] = [
  ...publicServerRoutes,
  ...privateClientRoutes,
  {
    path: '**',
    renderMode: RenderMode.Server,
    status: 404,
    headers: {
      'X-Robots-Tag': 'noindex, nofollow'
    }
  }
];
