/**
 * Interceptors Index
 * Central export point for all interceptors
 */

import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { ApiInterceptor } from './api.interceptor';
import { ErrorInterceptor } from './error.interceptor';

export * from './api.interceptor';
export * from './error.interceptor';

/**
 * Interceptor Providers
 * Use in main.ts with provideHttpClient(withInterceptorsFromDi())
 */
export const HTTP_INTERCEPTOR_PROVIDERS = [
  {
    provide: HTTP_INTERCEPTORS,
    useClass: ApiInterceptor,
    multi: true
  },
  {
    provide: HTTP_INTERCEPTORS,
    useClass: ErrorInterceptor,
    multi: true
  }
];
