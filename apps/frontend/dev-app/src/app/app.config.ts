import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
  provideZonelessChangeDetection,
} from '@angular/core';
import { provideNativeDateAdapter } from '@angular/material/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';
import { provideTranslateHttpLoader } from '@ngx-translate/http-loader';

import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { DICTIONARIES_TOKEN, ENVIRONMENT_TOKEN, MENU_ITEMS_TOKEN } from '@fe/tokens';
import { appRoutes } from './app.routes';
import { DICTIONARIES } from './data/dictionaries';
import { APP_MENU_ITEMS } from './data/menu-items';

import { ENVIRONMENT_DATA } from '../../environments/environment';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZonelessChangeDetection(),
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideRouter(appRoutes, withComponentInputBinding()),

    provideHttpClient(
          withFetch(),
          withInterceptors([
            // AuthInterceptor,
            // LoggingInterceptor,
          ]),
        ),

    provideTranslateService({
      fallbackLang: 'en',
      loader: provideTranslateHttpLoader({
        prefix:"i18n/",
        suffix:".json",
        enforceLoading: true,
        useHttpBackend: true,
      }),
    }),

    provideNativeDateAdapter(),
  // Provide the translaton dictionary for the dictionary store
  { provide: DICTIONARIES_TOKEN, useValue: DICTIONARIES },
  // Provide the menu items for the left menu
  { provide: MENU_ITEMS_TOKEN, useValue: APP_MENU_ITEMS },
  // Provide the environment configuration for the API URL and other settings
  { provide: ENVIRONMENT_TOKEN, useValue: ENVIRONMENT_DATA},

  ],
};
