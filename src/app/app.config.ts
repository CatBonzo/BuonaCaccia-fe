import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { registerLocaleData } from '@angular/common';
import localeIt from '@angular/common/locales/it';
import { ApplicationConfig, LOCALE_ID, importProvidersFrom, provideBrowserGlobalErrorListeners } from '@angular/core';
import { ApiConfiguration } from './api/api-configuration';
import { environment } from '../environments/environment';
import { authInterceptor, errorInterceptor } from './core/http.interceptors';
import { AppRoutingModule } from './app-routing.module';
import { provideOptimus } from '@openng/optimus-ui/config';
import Aura from '@openng/optimus-ui-themes/aura';

// Date, numeri e valuta in italiano.
registerLocaleData(localeIt);

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    { provide: LOCALE_ID, useValue: 'it' },
    importProvidersFrom(AppRoutingModule),
    // Optimus UI (fork MIT di PrimeNG, nessuna licenza): tema Aura, senza dark mode automatico.
    provideOptimus({ theme: { preset: Aura, options: { darkModeSelector: false } } }),
    provideHttpClient(withInterceptors([authInterceptor, errorInterceptor])),
    { provide: ApiConfiguration, useValue: { rootUrl: environment.apiUrl } },
  ],
};
