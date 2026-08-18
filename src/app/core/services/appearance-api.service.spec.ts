import '@angular/compiler';
import { HttpClient } from '@angular/common/http';
import { Injector, PLATFORM_ID, runInInjectionContext } from '@angular/core';
import { describe, expect, it, vi } from 'vitest';

import { AdminAuthService } from './admin-auth.service';
import { AppearanceApiService } from './appearance-api.service';

function createService(platformId: 'browser' | 'server') {
  const get = vi.fn(() => ({
    subscribe: vi.fn(() => ({ add: vi.fn() }))
  }));
  const injector = Injector.create({
    providers: [
      { provide: PLATFORM_ID, useValue: platformId },
      { provide: HttpClient, useValue: { get } },
      { provide: AdminAuthService, useValue: { user: vi.fn(() => null) } }
    ]
  });
  const service = runInInjectionContext(injector, () => new AppearanceApiService());

  return { service, get };
}

describe('AppearanceApiService platform loading', () => {
  it('does not make decorative appearance requests during SSR', () => {
    const { service, get } = createService('server');

    service.load();

    expect(get).not.toHaveBeenCalled();
  });

  it('loads appearance overrides in the browser', () => {
    const { service, get } = createService('browser');

    service.load();

    expect(get).toHaveBeenCalledOnce();
  });
});
