import { Injectable, signal } from '@angular/core';
import { donationApiUrl } from './runtime-config';

export interface DonationState {
  hasDonated: boolean;
  donorEmail?: string;
  loading: boolean;
  error?: string;
}

@Injectable({
  providedIn: 'root'
})
export class DonationService {
  readonly state = signal<DonationState>({
    hasDonated: false,
    loading: false
  });

  async createDonationSession(amount: number, donorEmail?: string): Promise<string | null> {
    this.state.update(s => ({ ...s, loading: true, error: undefined }));
    try {
      const apiUrl = donationApiUrl();
      if (!apiUrl) {
        throw new Error('Donations are not configured for this deployment.');
      }
      const res = await fetch(`${apiUrl}/checkout/create-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount,
          donorEmail,
          successUrl: window.location.origin + '?donated=success',
          cancelUrl: window.location.origin + '?donated=cancel'
        })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || typeof data.url !== 'string') {
        throw new Error(data.error || 'Unable to create a donation session.');
      }
      this.state.update(s => ({ ...s, loading: false }));
      return data.url || null;
    } catch (err) {
      console.error('Error creating donation checkout session:', err);
      this.state.update(s => ({ ...s, loading: false, error: err instanceof Error ? err.message : 'Unable to start a donation session.' }));
      return null;
    }
  }
}
