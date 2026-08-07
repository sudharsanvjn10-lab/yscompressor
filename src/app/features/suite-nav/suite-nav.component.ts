import { Component, EventEmitter, Output, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export type SuiteMode = 'compress' | 'resize-enhance' | 'crop-rotate' | 'img-to-pdf' | 'pdf-to-img';

@Component({
  selector: 'app-suite-nav',
  standalone: true,
  imports: [CommonModule],
  template: `
    <nav class="suite-tabs" aria-label="Suite feature navigation">
      <button 
        type="button" 
        class="tab-btn" 
        [class.active]="activeMode === 'compress'"
        (click)="selectMode('compress')"
      >
        <span class="icon">🗜️</span> Compress & Convert
      </button>

      <button 
        type="button" 
        class="tab-btn" 
        [class.active]="activeMode === 'resize-enhance'"
        (click)="selectMode('resize-enhance')"
      >
        <span class="icon">📐</span> Resize & Enhance
      </button>

      <button 
        type="button" 
        class="tab-btn" 
        [class.active]="activeMode === 'crop-rotate'"
        (click)="selectMode('crop-rotate')"
      >
        <span class="icon">✂️</span> Crop & Rotate
      </button>

      <button 
        type="button" 
        class="tab-btn" 
        [class.active]="activeMode === 'img-to-pdf'"
        (click)="selectMode('img-to-pdf')"
      >
        <span class="icon">📄</span> Image ➔ PDF
      </button>

      <button 
        type="button" 
        class="tab-btn" 
        [class.active]="activeMode === 'pdf-to-img'"
        (click)="selectMode('pdf-to-img')"
      >
        <span class="icon">🖼️</span> PDF ➔ Images
      </button>
    </nav>
  `,
  styles: [`
    .suite-tabs {
      display: flex;
      gap: 8px;
      margin-bottom: 24px;
      overflow-x: auto;
      padding-bottom: 4px;
      border-bottom: 1px solid var(--border-color, rgba(255, 255, 255, 0.08));
    }

    .tab-btn {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 18px;
      background: var(--bg-card, rgba(30, 41, 59, 0.5));
      border: 1px solid var(--border-color, rgba(255, 255, 255, 0.08));
      border-radius: 10px;
      color: var(--text-secondary, #94a3b8);
      font-size: 0.9rem;
      font-weight: 500;
      cursor: pointer;
      white-space: nowrap;
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .tab-btn:hover {
      background: var(--bg-secondary, rgba(255, 255, 255, 0.06));
      color: var(--text-primary, #f1f5f9);
    }

    .tab-btn.active {
      background: var(--accent-gradient, linear-gradient(135deg, #6366f1 0%, #4f46e5 100%));
      border-color: var(--accent-color, #6366f1);
      color: #ffffff;
      box-shadow: 0 4px 14px rgba(99, 102, 241, 0.35);
    }

    .icon {
      font-size: 1.1rem;
    }
  `]
})
export class SuiteNavComponent {
  @Input() activeMode: SuiteMode = 'compress';
  @Output() modeChanged = new EventEmitter<SuiteMode>();

  selectMode(mode: SuiteMode): void {
    this.modeChanged.emit(mode);
  }
}
