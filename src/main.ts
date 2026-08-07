import { bootstrapApplication } from '@angular/platform-browser';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { provideBrowserGlobalErrorListeners, mergeApplicationConfig } from '@angular/core';
import { appConfig } from './app/app.config';
import { App } from './app/app';

const browserConfig = mergeApplicationConfig(appConfig, {
  providers: [
    // Browser-only global error handler
    provideBrowserGlobalErrorListeners(),
    // Enables incremental hydration of server-prerendered HTML
    provideClientHydration(withEventReplay())
  ]
});

bootstrapApplication(App, browserConfig)
  .catch((err) => console.error(err));
