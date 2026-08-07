import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { Title, Meta } from '@angular/platform-browser';
import { DOCUMENT } from '@angular/common';
import { isPlatformBrowser } from '@angular/common';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

export interface RouteSeoData {
  title: string;
  description: string;
  ogImage?: string;
  canonicalPath?: string;
}

const BASE_URL = 'https://yazhsivconversion.app';

const ROUTE_SEO_MAP: Record<string, RouteSeoData> = {
  '': {
    title: 'Free Online Image Compressor, Resizer & PDF Converter',
    description:
      'YS Compressor — Compress JPEG, PNG, WebP images, resize, crop, rotate, and convert to PDF. 100% private, runs entirely in your browser with Web Workers. No uploads, no server.',
    ogImage: `${BASE_URL}/og-home.png`,
    canonicalPath: '/'
  },
  '/': {
    title: 'Free Online Image Compressor, Resizer & PDF Converter',
    description:
      'YS Compressor — Compress JPEG, PNG, WebP images, resize, crop, rotate, and convert to PDF. 100% private, runs entirely in your browser with Web Workers. No uploads, no server.',
    ogImage: `${BASE_URL}/og-home.png`,
    canonicalPath: '/'
  },
  '/feedback': {
    title: 'Feedback & Changelog',
    description:
      'Share feature requests, bug reports, and ideas for YS Compressor. View the product changelog and join the community discussion powered by GitHub Discussions.',
    canonicalPath: '/feedback'
  },
  '/about': {
    title: 'Privacy Policy & About',
    description:
      'YS Compressor is fully client-side. Zero data is uploaded to any server. Learn about our privacy-first architecture using browser APIs and Web Workers.',
    canonicalPath: '/about'
  }
};

@Injectable({
  providedIn: 'root'
})
export class SeoService {
  constructor(
    private titleService: Title,
    private metaService: Meta,
    @Inject(DOCUMENT) private document: Document,
    @Inject(PLATFORM_ID) private platformId: object,
    private router: Router
  ) {
    this.listenToRouteChanges();
  }

  /** Automatically update SEO on router navigation */
  private listenToRouteChanges(): void {
    this.router.events
      .pipe(filter(e => e instanceof NavigationEnd))
      .subscribe((e: NavigationEnd) => {
        const path = e.urlAfterRedirects.split('?')[0]; // Strip query params
        const data = ROUTE_SEO_MAP[path] ?? ROUTE_SEO_MAP[''];
        this.applyTags(data);
      });
  }

  /** Call manually to force update (e.g., on mode change inside main suite) */
  updateSeo(data: RouteSeoData): void {
    this.applyTags(data);
  }

  private applyTags(data: RouteSeoData): void {
    const fullTitle = data.title.includes('YS Compressor')
      ? data.title
      : `${data.title} | YS Compressor`;

    // ── Core ─────────────────────────────────────────────────────────────────
    this.titleService.setTitle(fullTitle);
    this.metaService.updateTag({ name: 'description', content: data.description });

    // ── Open Graph ───────────────────────────────────────────────────────────
    this.metaService.updateTag({ property: 'og:title', content: fullTitle });
    this.metaService.updateTag({ property: 'og:description', content: data.description });
    this.metaService.updateTag({ property: 'og:type', content: 'website' });
    this.metaService.updateTag({
      property: 'og:url',
      content: `${BASE_URL}${data.canonicalPath ?? '/'}`
    });
    if (data.ogImage) {
      this.metaService.updateTag({ property: 'og:image', content: data.ogImage });
      this.metaService.updateTag({ property: 'og:image:width', content: '1200' });
      this.metaService.updateTag({ property: 'og:image:height', content: '630' });
    }
    this.metaService.updateTag({ property: 'og:site_name', content: 'YS Compressor' });

    // ── Twitter Card ─────────────────────────────────────────────────────────
    this.metaService.updateTag({ name: 'twitter:card', content: 'summary_large_image' });
    this.metaService.updateTag({ name: 'twitter:title', content: fullTitle });
    this.metaService.updateTag({ name: 'twitter:description', content: data.description });
    this.metaService.updateTag({ name: 'twitter:site', content: '@yazhsivconversion' });
    if (data.ogImage) {
      this.metaService.updateTag({ name: 'twitter:image', content: data.ogImage });
    }

    // ── Canonical Link ────────────────────────────────────────────────────────
    if (data.canonicalPath) {
      this.upsertCanonical(`${BASE_URL}${data.canonicalPath}`);
    }
  }

  private upsertCanonical(href: string): void {
    let link: HTMLLinkElement | null = this.document.querySelector('link[rel="canonical"]');
    if (!link) {
      link = this.document.createElement('link');
      link.setAttribute('rel', 'canonical');
      this.document.head.appendChild(link);
    }
    link.setAttribute('href', href);
  }
}
