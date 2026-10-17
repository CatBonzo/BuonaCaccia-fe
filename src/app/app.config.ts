import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { registerLocaleData } from '@angular/common';
import localeIt from '@angular/common/locales/it';
import { ApplicationConfig, LOCALE_ID, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { providePrimeNG } from 'primeng/config';
import { ApiConfiguration } from './api/api-configuration';
import { environment } from '../environments/environment';
import { authInterceptor, errorInterceptor } from './core/http.interceptors';
import { BuonaCacciaPreset } from './core/tema-primeng';
import { routes } from './app.routes';

// Date, numeri e valuta in italiano.
registerLocaleData(localeIt);

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    { provide: LOCALE_ID, useValue: 'it' },
    providePrimeNG({
      theme: { preset: BuonaCacciaPreset, options: { darkModeSelector: '.app-dark', cssLayer: false } },
      ripple: false,
    }),
    provideRouter(routes, withComponentInputBinding()),
    provideHttpClient(withInterceptors([authInterceptor, errorInterceptor])),
    { provide: ApiConfiguration, useValue: { rootUrl: environment.apiUrl } },
  ],
};
