import { Component, ElementRef, Input, OnInit, OnDestroy, ViewChild, PLATFORM_ID, Inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { CookieConsentService } from '../../core/cookie-consent.service';
import { DEFAULT_AD_CONFIG, AdConfig } from '../../core/ad-config';

export type AdFormat = 'leaderboard' | 'rectangle' | 'banner' | 'skyscraper';

@Component({
  selector: 'app-ad-slot',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div 
      #adSlotRef
      class="ad-slot-wrapper"
      [ngClass]="format"
      [class.loaded]="isLoaded"
    >
      @if (!isLoaded) {
        <div class="ad-placeholder">
          <span class="ad-label">Advertisement ({{ format }})</span>
        </div>
      }
    </div>
  `,
  styles: [`
    .ad-slot-wrapper {
      margin: 16px auto;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--bg-card, rgba(30, 41, 59, 0.4));
      border: 1px dashed var(--border-color, rgba(255, 255, 255, 0.12));
      border-radius: 8px;
      overflow: hidden;
      contain: layout style;
    }

    /* Fixed CLS Dimensions */
    .ad-slot-wrapper.leaderboard {
      width: 100%;
      max-width: 728px;
      min-height: 90px;
    }

    .ad-slot-wrapper.rectangle {
      width: 100%;
      max-width: 300px;
      min-height: 250px;
    }

    .ad-slot-wrapper.banner {
      width: 100%;
      max-width: 320px;
      min-height: 50px;
    }

    .ad-slot-wrapper.skyscraper {
      width: 160px;
      min-height: 600px;
    }

    .ad-placeholder {
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--text-secondary, #94a3b8);
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      text-align: center;
      padding: 12px;
    }
  `]
})
export class AdSlotComponent implements OnInit, OnDestroy {
  @Input() format: AdFormat = 'leaderboard';
  @Input() slotId: string = 'ad-slot-default';
  @Input() config: AdConfig = DEFAULT_AD_CONFIG;

  @ViewChild('adSlotRef', { static: true }) adSlotRef!: ElementRef<HTMLElement>;

  isLoaded = false;
  private observer?: IntersectionObserver;

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    public cookieService: CookieConsentService
  ) {}

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    if (typeof IntersectionObserver === 'undefined') {
      this.loadAdScript();
      return;
    }

    this.observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        this.loadAdScript();
        this.observer?.disconnect();
      }
    }, { threshold: 0.1 });

    if (this.adSlotRef?.nativeElement) {
      this.observer.observe(this.adSlotRef.nativeElement);
    }
  }

  private loadAdScript(): void {
    if (!this.config.enabled) return;

    // Gate ad script loading until user gives consent or if rejected
    if (this.cookieService.consentState() === 'rejected') {
      return;
    }

    // Network-agnostic script loader hook
    this.isLoaded = true;
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
  }
}
