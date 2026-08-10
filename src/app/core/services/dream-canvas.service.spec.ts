import '@angular/compiler';
import { Injector, PLATFORM_ID, runInInjectionContext } from '@angular/core';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { DreamCanvasService } from './dream-canvas.service';

function createService(platformId: 'browser' | 'server'): DreamCanvasService {
  const injector = Injector.create({ providers: [{ provide: PLATFORM_ID, useValue: platformId }] });
  return runInInjectionContext(injector, () => new DreamCanvasService());
}

describe('DreamCanvasService platform storage', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('does not access browser storage while rendering the server shell', () => {
    const getItem = vi.fn();
    const setItem = vi.fn();
    vi.stubGlobal('localStorage', { getItem, setItem });

    const service = createService('server');
    service.add({ productId: 42, name: 'تور عروس' });

    expect(service.items).toHaveLength(1);
    expect(getItem).not.toHaveBeenCalled();
    expect(setItem).not.toHaveBeenCalled();
  });

  it('restores and persists personal selections in the browser', () => {
    const stored = [{ productId: 7, name: 'تاج عروس', addedAt: '2026-01-01T00:00:00.000Z' }];
    const getItem = vi.fn(() => JSON.stringify({ items: stored, ids: [7], expiresAt: Date.now() + 10_000 }));
    const setItem = vi.fn();
    vi.stubGlobal('localStorage', { getItem, setItem, removeItem: vi.fn() });

    const service = createService('browser');
    service.add({ productId: 8, name: 'کفش عروس' });

    expect(service.items.map(item => item.productId)).toEqual([7, 8]);
    expect(setItem).toHaveBeenCalledOnce();
  });
});
