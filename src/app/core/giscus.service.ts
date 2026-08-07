import { Injectable, PLATFORM_ID, Inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { ThemeService } from './theme.service';

export interface GiscusConfig {
  repo: string;
  repoId: string;
  category: string;
  categoryId: string;
}

@Injectable({
  providedIn: 'root'
})
export class GiscusService {
  readonly defaultConfig: GiscusConfig = {
    repo: 'yazhsivconversion/feedback',
    repoId: 'R_kgDOGiscusPlaceholder',
    category: 'General',
    categoryId: 'DIC_kwDOGiscusCategoryPlaceholder'
  };

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private themeService: ThemeService
  ) {}

  loadGiscusScript(container: HTMLElement, config = this.defaultConfig): void {
    if (!isPlatformBrowser(this.platformId) || !container) return;

    // Remove existing script if any
    const existing = container.querySelector('script[src*="giscus.app"]');
    if (existing) existing.remove();

    const script = document.createElement('script');
    script.src = 'https://giscus.app/client.js';
    script.setAttribute('data-repo', config.repo);
    script.setAttribute('data-repo-id', config.repoId);
    script.setAttribute('data-category', config.category);
    script.setAttribute('data-category-id', config.categoryId);
    script.setAttribute('data-mapping', 'pathname');
    script.setAttribute('data-strict', '0');
    script.setAttribute('data-reactions-enabled', '1');
    script.setAttribute('data-emit-metadata', '0');
    script.setAttribute('data-input-position', 'top');
    script.setAttribute('data-theme', this.themeService.theme() === 'dark' ? 'dark' : 'light');
    script.setAttribute('crossorigin', 'anonymous');
    script.async = true;

    container.appendChild(script);
  }

  updateGiscusTheme(theme: 'light' | 'dark'): void {
    if (!isPlatformBrowser(this.platformId)) return;
    const iframe = document.querySelector<HTMLIFrameElement>('iframe.giscus-frame');
    if (iframe && iframe.contentWindow) {
      iframe.contentWindow.postMessage(
        { giscus: { setConfig: { theme } } },
        'https://giscus.app'
      );
    }
  }
}
