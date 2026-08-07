import { bootstrapApplication } from '@angular/platform-browser';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideRouter, withInMemoryScrolling } from '@angular/router';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { importProvidersFrom, provideZoneChangeDetection } from '@angular/core';
import { registerLocaleData } from '@angular/common';
import localeFa from '@angular/common/locales/fa';
import { StoreModule } from '@ngrx/store';
import { EffectsModule } from '@ngrx/effects';
import { StoreDevtoolsModule } from '@ngrx/store-devtools';

import { AppComponent } from './app/app.component';
import { routes } from './app/app.routes';
import { environment } from '@env/environment';
import { appStore } from '@core/store';
import { CartEffects } from '@core/store/cart/cart.effects';
import { HTTP_INTERCEPTOR_PROVIDERS } from '@core/interceptors';

// پایپ‌های number/date با 'fa-IR' بدون این ثبت، در کل پنل ادمین کرش می‌کنند.
registerLocaleData(localeFa, 'fa-IR');

bootstrapApplication(AppComponent, {
  providers: [
    provideZoneChangeDetection(),provideAnimations(),
    provideRouter(
      routes,
      withInMemoryScrolling({
        scrollPositionRestoration: 'top',
        anchorScrolling: 'enabled'
      })
    ),
    provideHttpClient(withInterceptorsFromDi()),
    HTTP_INTERCEPTOR_PROVIDERS,
    importProvidersFrom(
      StoreModule.forRoot(appStore),
      EffectsModule.forRoot([CartEffects]),
      environment.production 
        ? [] 
        : StoreDevtoolsModule.instrument({
            maxAge: 25,
            logOnly: environment.production
          })
    )
  ]
}).catch(err => console.error(err));
