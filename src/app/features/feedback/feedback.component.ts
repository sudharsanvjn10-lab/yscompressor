import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SeoService } from '../../core/seo.service';
import { AdSlotComponent } from '../ad-slot/ad-slot.component';

interface FeedbackEntry {
  name: string;
  category: string;
  message: string;
  time: string;
}

@Component({
  selector: 'app-feedback',
  standalone: true,
  imports: [CommonModule, FormsModule, AdSlotComponent],
  template: `
    <div class="feedback-page">
      <div class="header-banner">
        <h2>💬 Feedback & Changelog</h2>
        <p>Have feature suggestions or bug reports? Send us your feedback — we read every message!</p>
      </div>

      <!-- Top Ad Slot -->
      <app-ad-slot format="leaderboard" slotId="ad-feedback-top" />

      <!-- Feedback Form Card -->
      <div class="feedback-card">
        <h3 class="section-title">📝 Submit Feedback</h3>

        @if (submitted) {
          <div class="success-banner">
            ✅ <strong>Thank you!</strong> Your feedback has been recorded. We'll review it shortly.
            <button class="btn-another" (click)="resetForm()">Submit Another</button>
          </div>
        } @else {
          <form class="feedback-form" (ngSubmit)="onSubmit()">
            <div class="form-row">
              <div class="field-group">
                <label for="fb-name">Your Name <span class="optional">(optional)</span></label>
                <input
                  id="fb-name"
                  type="text"
                  [(ngModel)]="form.name"
                  name="name"
                  placeholder="e.g. Sudharsan"
                  class="form-input"
                />
              </div>
              <div class="field-group">
                <label for="fb-category">Category</label>
                <select id="fb-category" [(ngModel)]="form.category" name="category" class="form-input">
                  <option value="bug">🐛 Bug Report</option>
                  <option value="feature">💡 Feature Request</option>
                  <option value="general">💬 General Feedback</option>
                  <option value="praise">⭐ Praise / Compliment</option>
                </select>
              </div>
            </div>

            <div class="field-group">
              <label for="fb-message">Message <span class="required">*</span></label>
              <textarea
                id="fb-message"
                [(ngModel)]="form.message"
                name="message"
                rows="5"
                placeholder="Describe the bug, feature, or share your thoughts..."
                class="form-input form-textarea"
                required
              ></textarea>
            </div>

            <div class="form-actions">
              <a
                class="btn-email"
                [href]="getMailtoLink()"
                target="_blank"
                rel="noopener noreferrer"
              >
                📧 Send via Email
              </a>
              <button type="submit" class="btn-submit" [disabled]="!form.message.trim()">
                💾 Save Feedback Locally
              </button>
            </div>

            <p class="contact-note">
              Or email us directly at:
              <a href="mailto:sudharsanvjn10@gmail.com" class="email-link">sudharsanvjn10@gmail.com</a>
            </p>
          </form>
        }
      </div>

      <!-- Submitted Feedbacks (local session) -->
      @if (feedbackList.length > 0) {
        <div class="feedback-list-card">
          <h3 class="section-title">📬 Your Submitted Feedback (This Session)</h3>
          <div class="feedback-entries">
            @for (entry of feedbackList; track entry.time) {
              <div class="feedback-entry">
                <div class="entry-header">
                  <span class="entry-category" [class]="'cat-' + entry.category">
                    {{ getCategoryLabel(entry.category) }}
                  </span>
                  <span class="entry-name">{{ entry.name || 'Anonymous' }}</span>
                  <span class="entry-time">{{ entry.time }}</span>
                </div>
                <p class="entry-message">{{ entry.message }}</p>
              </div>
            }
          </div>
        </div>
      }

      <!-- Changelog Section -->
      <div class="changelog-section">
        <h3>🚀 Product Changelog</h3>
        <ul class="changelog-list">
          <li><strong>v2.5 (August 2026)</strong>: Renamed to YS Compressor. Added Dev-stage banner, fixed Crop & Rotate processing, PDF-to-Image extraction, and improved donation modal.</li>
          <li><strong>v2.4 (August 2026)</strong>: Added Website-Wide Light/Dark Theme Toggle, PDF.js Page Extraction Engine, browser-native PNG output, and Open-Source Donation Model.</li>
          <li><strong>v2.0 (August 2026)</strong>: Dual-subpool Web Worker pipeline for image compression and multi-page PDF compilation.</li>
        </ul>
      </div>

      <!-- Bottom Ad Slot -->
      <app-ad-slot format="rectangle" slotId="ad-feedback-bottom" />
    </div>
  `,
  styles: [`
    .feedback-page {
      max-width: 900px;
      margin: 0 auto;
      padding: 32px 20px;
      color: var(--text-primary);
    }

    .header-banner {
      margin-bottom: 24px;
    }

    .header-banner h2 {
      font-size: 1.6rem;
      margin: 0 0 8px 0;
    }

    .header-banner p {
      color: var(--text-secondary);
      margin: 0;
      font-size: 0.95rem;
    }

    .feedback-card {
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: 14px;
      padding: 28px;
      margin: 24px 0;
    }

    .section-title {
      margin: 0 0 20px 0;
      font-size: 1.1rem;
      font-weight: 700;
      color: var(--text-primary);
    }

    .feedback-form {
      display: flex;
      flex-direction: column;
      gap: 18px;
    }

    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
    }

    @media (max-width: 600px) {
      .form-row { grid-template-columns: 1fr; }
    }

    .field-group {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .field-group label {
      font-size: 0.82rem;
      font-weight: 600;
      color: var(--text-secondary);
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }

    .optional { font-weight: 400; opacity: 0.7; text-transform: none; }
    .required { color: #f87171; }

    .form-input {
      background: var(--bg-secondary);
      border: 1px solid var(--border-color);
      border-radius: 8px;
      padding: 10px 14px;
      color: var(--text-primary);
      font-size: 0.9rem;
      font-family: inherit;
      transition: border-color 0.2s ease;
      outline: none;
    }

    .form-input:focus {
      border-color: var(--accent-color, #6366f1);
      box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.15);
    }

    .form-textarea {
      resize: vertical;
      min-height: 120px;
    }

    select.form-input {
      cursor: pointer;
    }

    .form-actions {
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
    }

    .btn-submit {
      flex: 1;
      padding: 11px 20px;
      background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
      color: #ffffff;
      border: none;
      border-radius: 8px;
      font-weight: 700;
      font-size: 0.9rem;
      cursor: pointer;
      transition: all 0.2s ease;
      box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
    }

    .btn-submit:hover:not(:disabled) {
      transform: translateY(-1px);
      box-shadow: 0 6px 16px rgba(99, 102, 241, 0.4);
    }

    .btn-submit:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .btn-email {
      flex: 1;
      padding: 11px 20px;
      background: var(--bg-secondary);
      color: var(--text-primary);
      border: 1px solid var(--border-color);
      border-radius: 8px;
      font-weight: 600;
      font-size: 0.9rem;
      cursor: pointer;
      text-decoration: none;
      text-align: center;
      transition: all 0.2s ease;
    }

    .btn-email:hover {
      background: rgba(99, 102, 241, 0.1);
      border-color: #6366f1;
    }

    .contact-note {
      font-size: 0.82rem;
      color: var(--text-secondary);
      margin: 0;
      text-align: center;
    }

    .email-link {
      color: #818cf8;
      font-weight: 600;
      text-decoration: none;
    }

    .email-link:hover {
      text-decoration: underline;
    }

    .success-banner {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 16px 20px;
      background: rgba(16, 185, 129, 0.12);
      border: 1px solid rgba(16, 185, 129, 0.3);
      border-radius: 10px;
      color: #6ee7b7;
      font-size: 0.95rem;
    }

    .btn-another {
      margin-left: auto;
      padding: 6px 14px;
      background: rgba(16, 185, 129, 0.2);
      border: 1px solid rgba(16, 185, 129, 0.4);
      border-radius: 6px;
      color: #6ee7b7;
      font-size: 0.82rem;
      cursor: pointer;
      white-space: nowrap;
    }

    /* Feedback List */
    .feedback-list-card {
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: 14px;
      padding: 28px;
      margin-bottom: 24px;
    }

    .feedback-entries {
      display: flex;
      flex-direction: column;
      gap: 14px;
    }

    .feedback-entry {
      background: var(--bg-secondary);
      border: 1px solid var(--border-color);
      border-radius: 10px;
      padding: 14px 18px;
    }

    .entry-header {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 8px;
      flex-wrap: wrap;
    }

    .entry-category {
      padding: 2px 10px;
      border-radius: 9999px;
      font-size: 0.75rem;
      font-weight: 700;
    }

    .cat-bug    { background: rgba(239,68,68,0.15); color: #fca5a5; }
    .cat-feature{ background: rgba(99,102,241,0.15); color: #a5b4fc; }
    .cat-general{ background: rgba(148,163,184,0.15); color: #cbd5e1; }
    .cat-praise { background: rgba(234,179,8,0.15); color: #fde047; }

    .entry-name {
      font-size: 0.85rem;
      font-weight: 600;
      color: var(--text-primary);
    }

    .entry-time {
      margin-left: auto;
      font-size: 0.75rem;
      color: var(--text-secondary);
    }

    .entry-message {
      margin: 0;
      font-size: 0.88rem;
      color: var(--text-secondary);
      line-height: 1.55;
    }

    /* Changelog */
    .changelog-section {
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: 14px;
      padding: 28px;
      margin-top: 8px;
    }

    .changelog-section h3 {
      margin: 0 0 16px 0;
      font-size: 1.1rem;
    }

    .changelog-list {
      margin: 0;
      padding-left: 20px;
      color: var(--text-secondary);
      line-height: 1.8;
      font-size: 0.9rem;
    }

    .changelog-list li {
      margin-bottom: 6px;
    }
  `]
})
export class FeedbackComponent implements OnInit {
  form = {
    name: '',
    category: 'bug',
    message: ''
  };

  submitted = false;
  feedbackList: FeedbackEntry[] = [];

  constructor(private seoService: SeoService) {}

  ngOnInit(): void {
    this.seoService.updateSeo({
      title: 'Feedback & Changelog',
      description: 'Submit bug reports, feature requests, and feedback for YS Compressor. We read every message!'
    });
  }

  onSubmit(): void {
    if (!this.form.message.trim()) return;

    const entry: FeedbackEntry = {
      name: this.form.name.trim(),
      category: this.form.category,
      message: this.form.message.trim(),
      time: new Date().toLocaleTimeString()
    };

    this.feedbackList.unshift(entry);
    this.submitted = true;
  }

  resetForm(): void {
    this.form = { name: '', category: 'bug', message: '' };
    this.submitted = false;
  }

  getMailtoLink(): string {
    const subject = encodeURIComponent(`[YS Compressor Feedback] ${this.getCategoryLabel(this.form.category)}`);
    const body = encodeURIComponent(
      `Name: ${this.form.name || 'Anonymous'}\nCategory: ${this.getCategoryLabel(this.form.category)}\n\n${this.form.message}`
    );
    return `mailto:sudharsanvjn10@gmail.com?subject=${subject}&body=${body}`;
  }

  getCategoryLabel(cat: string): string {
    const map: Record<string, string> = {
      bug: '🐛 Bug Report',
      feature: '💡 Feature Request',
      general: '💬 General Feedback',
      praise: '⭐ Praise'
    };
    return map[cat] || cat;
  }
}
