import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CookieConsentService } from '../../core/cookie-consent.service';

@Component({
  selector: 'app-cookie-consent',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (cookieService.consentState() === 'pending') {
      <div class="cookie-banner-container">
        <div class="cookie-content">
          <p class="cookie-text">
            🍪 We use privacy-conscious local storage for theme settings and non-intrusive ad placement. No uploaded media files ever leave your device.
          </p>
          <div class="cookie-actions">
            <button type="button" class="btn-cookie-accept" (click)="cookieService.acceptConsent()">
              Accept All
            </button>
            <button type="button" class="btn-cookie-reject" (click)="cookieService.rejectConsent()">
              Necessary Only
            </button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .cookie-banner-container {
      position: fixed;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%);
      width: calc(100% - 40px);
      max-width: 760px;
      background: var(--bg-card, #1e293b);
      border: 1px solid var(--border-color, rgba(255, 255, 255, 0.15));
      border-radius: 12px;
      padding: 16px 20px;
      z-index: 999;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.4);
      color: var(--text-primary);
    }

    .cookie-content {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      flex-wrap: wrap;
    }

    .cookie-text {
      margin: 0;
      font-size: 0.85rem;
      color: var(--text-secondary);
      flex: 1;
      min-width: 260px;
      line-height: 1.4;
    }

    .cookie-actions {
      display: flex;
      gap: 10px;
    }

    .btn-cookie-accept {
      background: var(--accent-gradient, linear-gradient(135deg, #6366f1, #4f46e5));
      color: #ffffff;
      border: none;
      padding: 8px 16px;
      border-radius: 6px;
      font-weight: 600;
      font-size: 0.85rem;
      cursor: pointer;
    }

    .btn-cookie-reject {
      background: var(--bg-secondary);
      color: var(--text-secondary);
      border: 1px solid var(--border-color);
      padding: 8px 14px;
      border-radius: 6px;
      font-weight: 500;
      font-size: 0.85rem;
      cursor: pointer;
    }
  `]
})
export class CookieConsentComponent {
  constructor(public cookieService: CookieConsentService) {}
}
