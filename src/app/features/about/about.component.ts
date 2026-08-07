import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SeoService } from '../../core/seo.service';
import { AdSlotComponent } from '../ad-slot/ad-slot.component';

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [CommonModule, AdSlotComponent],
  template: `
    <div class="about-page">
      <div class="about-card">
        <h2>🔒 Privacy Architecture & Technology</h2>
        <p class="lead-text">
          YS Compressor was engineered to solve a fundamental privacy challenge in modern web utilities: processing sensitive images and documents without sending them to third-party cloud servers.
        </p>

        <div class="tech-grid">
          <div class="tech-item">
            <h4>⚡ Browser Canvas APIs</h4>
            <p>Uses browser-native image decoding and encoding APIs in isolated workers, keeping image data local while processing remains responsive.</p>
          </div>
          <div class="tech-item">
            <h4>🧵 Web Worker Threads</h4>
            <p>Offloads heavy compression algorithms and PDF vector rendering into dedicated background threads, ensuring the UI looper remains buttery smooth.</p>
          </div>
          <div class="tech-item">
            <h4>🛡️ Zero Egress Network Policy</h4>
            <p>Media files, image bitmaps, and PDF pages stay 100% inside local browser memory. Zero file data is ever uploaded or transmitted.</p>
          </div>
        </div>
      </div>

      <!-- Non-processing Ad Slot -->
      <app-ad-slot format="leaderboard" slotId="ad-about-bottom" />
    </div>
  `,
  styles: [`
    .about-page {
      max-width: 900px;
      margin: 0 auto;
      padding: 32px 20px;
      color: var(--text-primary);
    }

    .about-card {
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: 12px;
      padding: 32px;
      margin-bottom: 24px;
    }

    .about-card h2 {
      margin: 0 0 12px 0;
      font-size: 1.5rem;
    }

    .lead-text {
      color: var(--text-secondary);
      font-size: 1rem;
      line-height: 1.6;
      margin-bottom: 28px;
    }

    .tech-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 20px;
    }

    .tech-item {
      background: var(--bg-secondary);
      border: 1px solid var(--border-color);
      border-radius: 8px;
      padding: 20px;
    }

    .tech-item h4 {
      margin: 0 0 8px 0;
      font-size: 1rem;
    }

    .tech-item p {
      margin: 0;
      color: var(--text-secondary);
      font-size: 0.85rem;
      line-height: 1.5;
    }
  `]
})
export class AboutComponent implements OnInit {
  constructor(private seoService: SeoService) {}

  ngOnInit(): void {
    this.seoService.updateSeo({
      title: 'Privacy & Architecture',
      description: 'Learn how YS Compressor processes images and PDFs 100% client-side using browser APIs and Web Workers with zero cloud uploads.'
    });
  }
}
