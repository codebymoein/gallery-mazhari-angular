import { RenderMode } from '@angular/ssr';
import { describe, expect, it } from 'vitest';

import { serverRoutes } from './app.routes.server';

describe('serverRoutes', () => {
  it('server-renders indexable public routes', () => {
    const home = serverRoutes.find((route) => route.path === '');
    const product = serverRoutes.find((route) => route.path === 'product/:id');

    expect(home?.renderMode).toBe(RenderMode.Server);
    expect(product?.renderMode).toBe(RenderMode.Server);
  });

  it('keeps private/admin routes client-rendered and noindex', () => {
    const account = serverRoutes.find((route) => route.path === 'account');
    const admin = serverRoutes.find((route) => route.path === 'admin/**');

    expect(account?.renderMode).toBe(RenderMode.Client);
    expect(account?.headers?.['X-Robots-Tag']).toContain('noindex');
    expect(admin?.renderMode).toBe(RenderMode.Client);
  });

  it('returns a real 404 for unmatched routes', () => {
    const fallback = serverRoutes.find((route) => route.path === '**');

    expect(fallback?.renderMode).toBe(RenderMode.Server);
    expect(fallback?.status).toBe(404);
    expect(fallback?.headers?.['X-Robots-Tag']).toContain('noindex');
  });
});
