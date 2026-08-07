import { Injectable, Inject, PLATFORM_ID, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export type Theme = 'light' | 'dark';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private readonly STORAGE_KEY = 'yazhsivconversion-theme';
  readonly theme = signal<Theme>('dark');

  constructor(@Inject(PLATFORM_ID) private platformId: object) {
    this.initTheme();
  }

  private initTheme(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    try {
      const stored = localStorage.getItem(this.STORAGE_KEY) as Theme | null;
      let resolvedTheme: Theme = 'dark';

      if (stored === 'light' || stored === 'dark') {
        resolvedTheme = stored;
      } else if (typeof window !== 'undefined' && window.matchMedia) {
        resolvedTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      }

      this.setTheme(resolvedTheme);
    } catch (err) {
      console.warn('Failed to resolve theme from localStorage/matchMedia:', err);
      this.setTheme('dark');
    }
  }

  toggle(): void {
    const nextTheme: Theme = this.theme() === 'dark' ? 'light' : 'dark';
    this.setTheme(nextTheme);
  }

  setTheme(newTheme: Theme): void {
    this.theme.set(newTheme);

    if (isPlatformBrowser(this.platformId)) {
      try {
        localStorage.setItem(this.STORAGE_KEY, newTheme);
        document.documentElement.setAttribute('data-theme', newTheme);
      } catch (err) {
        console.warn('Failed to persist theme state:', err);
      }
    }
  }
}
