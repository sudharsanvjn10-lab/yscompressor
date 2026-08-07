import { ApplicationConfig } from '@angular/core';
import { provideRouter, withInMemoryScrolling } from '@angular/router';

import { routes } from './app.routes';

/**
 * Shared application config — safe to run on both browser and server (SSR/prerender).
 * Browser-only providers (provideClientHydration, provideBrowserGlobalErrorListeners)
 * are added separately in main.ts (browser entry) and are NOT included here.
 */
export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(
      routes,
      withInMemoryScrolling({ scrollPositionRestoration: 'top' })
    )
  ]
};
