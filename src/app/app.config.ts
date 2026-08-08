import { provideHttpClient, withFetch, withInterceptorsFromDi } from '@angular/common/http';
import { registerLocaleData } from '@angular/common';
import localeFa from '@angular/common/locales/fa';
import { importProvidersFrom, provideZoneChangeDetection, type ApplicationConfig } from '@angular/core';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { provideRouter, withInMemoryScrolling } from '@angular/router';
import { EffectsModule } from '@ngrx/effects';
import { StoreModule } from '@ngrx/store';
import { StoreDevtoolsModule } from '@ngrx/store-devtools';

import { environment } from '@env/environment';
import { HTTP_INTERCEPTOR_PROVIDERS } from '@core/interceptors';
import { appStore } from '@core/store';
import { CartEffects } from '@core/store/cart/cart.effects';
import { routes } from './app.routes';

registerLocaleData(localeFa, 'fa');
registerLocaleData(localeFa, 'fa-IR');

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection(),
    provideAnimations(),
    provideClientHydration(withEventReplay()),
    provideRouter(
      routes,
      withInMemoryScrolling({
        scrollPositionRestoration: 'top',
        anchorScrolling: 'enabled'
      })
    ),
    provideHttpClient(withFetch(), withInterceptorsFromDi()),
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
};
