import { Component, EventEmitter, Output, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DonationService } from '../../core/donation.service';

@Component({
  selector: 'app-donation-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    @if (isOpen) {
      <div class="modal-backdrop" (click)="closeModal()">
        <div class="modal-card" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3>💖 Support YS Compressor Open Source</h3>
            <button class="close-btn" (click)="closeModal()" aria-label="Close modal">✕</button>
          </div>

          <div class="modal-body">
            <p class="intro-text">
              YS Compressor is <strong>100% free, private, and serverless</strong>. All image and PDF processing occurs directly on your device with zero cloud tracking or monthly subscription fees.
            </p>

            <p class="support-tagline">Support us with a donation of <strong>$1, $2, or up to $5</strong>. Every bit helps! 🙏</p>

            <div class="preset-amounts">
              <button 
                type="button" 
                class="amount-btn" 
                [class.selected]="selectedAmount === 1"
                (click)="selectedAmount = 1"
              >
                🤝 $1 Kind
              </button>
              <button 
                type="button" 
                class="amount-btn" 
                [class.selected]="selectedAmount === 2"
                (click)="selectedAmount = 2"
              >
                ☕ $2 Coffee
              </button>
              <button 
                type="button" 
                class="amount-btn" 
                [class.selected]="selectedAmount === 5"
                (click)="selectedAmount = 5"
              >
                🌟 $5 Supporter
              </button>
            </div>

            <div class="custom-amount-row">
              <label>Or enter custom amount ($):</label>
              <input 
                type="number" 
                min="1" 
                [(ngModel)]="selectedAmount" 
                class="custom-input"
              />
            </div>

            <button 
              type="button" 
              class="btn-donate-submit" 
              [disabled]="donationService.state().loading || selectedAmount < 1"
              (click)="onDonateClick()"
            >
              ❤️ Donate $ {{ selectedAmount }} via Stripe
            </button>

            @if (donationService.state().error) {
              <div class="error-banner">
                ⚠️ {{ donationService.state().error }}
              </div>
            }
            <div class="contact-banner">
              📧 Questions? Contact us at: <a href="mailto:sudharsanvjn10@gmail.com" class="contact-link">sudharsanvjn10@gmail.com</a>
            </div>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .modal-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(15, 23, 42, 0.8);
      backdrop-filter: blur(8px);
      z-index: 1000;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }

    .modal-card {
      background: var(--bg-card, #1e293b);
      border: 1px solid var(--border-color, rgba(255, 255, 255, 0.15));
      border-radius: 16px;
      width: 100%;
      max-width: 480px;
      overflow: hidden;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
      color: var(--text-primary);
    }

    .modal-header {
      padding: 20px 24px;
      background: var(--bg-secondary);
      border-bottom: 1px solid var(--border-color);
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .modal-header h3 {
      margin: 0;
      font-size: 1.15rem;
    }

    .close-btn {
      background: transparent;
      border: none;
      color: var(--text-secondary);
      font-size: 1.2rem;
      cursor: pointer;
    }

    .modal-body {
      padding: 24px;
      display: flex;
      flex-direction: column;
      gap: 18px;
    }

    .intro-text {
      font-size: 0.9rem;
      color: var(--text-secondary);
      line-height: 1.5;
      margin: 0;
    }

    .preset-amounts {
      display: flex;
      gap: 10px;
    }

    .amount-btn {
      flex: 1;
      padding: 10px;
      background: var(--bg-secondary);
      border: 1px solid var(--border-color);
      border-radius: 8px;
      color: var(--text-primary);
      font-size: 0.85rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .amount-btn.selected {
      background: var(--accent-gradient);
      border-color: var(--accent-color);
      color: #ffffff;
    }

    .custom-amount-row {
      display: flex;
      align-items: center;
      gap: 12px;
      font-size: 0.85rem;
      color: var(--text-secondary);
    }

    .custom-input {
      width: 100px;
      padding: 8px 12px;
      background: var(--bg-secondary);
      border: 1px solid var(--border-color);
      border-radius: 8px;
      color: var(--text-primary);
      font-family: monospace;
    }

    .btn-donate-submit {
      width: 100%;
      padding: 12px;
      background: linear-gradient(135deg, #ec4899 0%, #db2777 100%);
      color: #ffffff;
      border: none;
      border-radius: 8px;
      font-weight: 700;
      font-size: 1rem;
      cursor: pointer;
      box-shadow: 0 4px 14px rgba(236, 72, 153, 0.4);
      transition: all 0.2s ease;
    }

    .error-banner {
      padding: 8px 12px;
      background: rgba(239, 68, 68, 0.15);
      border: 1px solid rgba(239, 68, 68, 0.3);
      color: #f87171;
      border-radius: 6px;
      font-size: 0.85rem;
    }

    .support-tagline {
      font-size: 0.88rem;
      color: var(--text-secondary);
      margin: 0;
    }

    .contact-banner {
      padding: 8px 12px;
      background: rgba(99, 102, 241, 0.08);
      border: 1px solid rgba(99, 102, 241, 0.2);
      border-radius: 6px;
      font-size: 0.82rem;
      color: var(--text-secondary);
    }

    .contact-link {
      color: #818cf8;
      text-decoration: none;
      font-weight: 600;
    }

    .contact-link:hover {
      text-decoration: underline;
    }
  `]
})
export class DonationModalComponent {
  @Input() isOpen = false;
  @Output() close = new EventEmitter<void>();

  selectedAmount = 1;

  constructor(public donationService: DonationService) {}

  closeModal(): void {
    this.close.emit();
  }

  async onDonateClick(): Promise<void> {
    const url = await this.donationService.createDonationSession(this.selectedAmount);
    if (url) {
      window.location.href = url;
    }
  }
}
