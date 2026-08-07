import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  // /feedback and /about are static pages — fully prerender them at build time
  { path: 'feedback', renderMode: RenderMode.Prerender },
  { path: 'about', renderMode: RenderMode.Prerender },
  // Root '/' is the interactive media suite — CSR is appropriate (workers, wasm, canvas)
  // All unknown paths also fall back to client-side rendering
  { path: '**', renderMode: RenderMode.Client }
];
