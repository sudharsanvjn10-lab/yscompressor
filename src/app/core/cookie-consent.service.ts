import { Injectable, signal, PLATFORM_ID, Inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export type CookieConsentState = 'accepted' | 'rejected' | 'pending';

@Injectable({
  providedIn: 'root'
})
export class CookieConsentService {
  private readonly STORAGE_KEY = 'yazhsivconversion-cookie-consent';
  readonly consentState = signal<CookieConsentState>('pending');

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    if (isPlatformBrowser(this.platformId)) {
      const stored = localStorage.getItem(this.STORAGE_KEY) as CookieConsentState;
      if (stored === 'accepted' || stored === 'rejected') {
        this.consentState.set(stored);
      }
    }
  }

  acceptConsent(): void {
    this.consentState.set('accepted');
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem(this.STORAGE_KEY, 'accepted');
    }
  }

  rejectConsent(): void {
    this.consentState.set('rejected');
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem(this.STORAGE_KEY, 'rejected');
    }
  }
}
