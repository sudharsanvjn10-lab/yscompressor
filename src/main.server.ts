import { bootstrapApplication } from '@angular/platform-browser';
import { BootstrapContext } from '@angular/platform-browser';
import { config } from './app/app.config.server';
import { App } from './app/app';

/**
 * Angular v22 SSR entry point.
 * The default export MUST be a function that receives a BootstrapContext
 * and returns Promise<ApplicationRef>. The build tooling calls this during
 * prerendering with the appropriate platform context.
 */
const bootstrap = (context: BootstrapContext) =>
  bootstrapApplication(App, config, context);

export default bootstrap;
