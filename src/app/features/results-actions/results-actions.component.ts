import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-results-actions',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="actions-bar">
      <div class="stats-summary">
        <div class="stat-item">
          <span class="stat-value">{{ completedCount }} / {{ totalCount }}</span>
          <span class="stat-label">Processed</span>
        </div>

        @if (totalOriginalBytes > 0 && totalCompressedBytes > 0) {
          <div class="stat-divider"></div>
          <div class="stat-item">
            <span class="stat-value highlight">{{ totalSavingsPercentage }}%</span>
            <span class="stat-label">Total Savings</span>
          </div>

          <div class="stat-divider"></div>
          <div class="stat-item">
            <span class="stat-value">{{ formatBytes(savedBytes) }}</span>
            <span class="stat-label">Space Saved</span>
          </div>
        }
      </div>

      <div class="button-group">
        <button 
          type="button" 
          class="btn btn-secondary" 
          [disabled]="totalCount === 0"
          (click)="clearAll.emit()"
        >
          Clear Queue
        </button>

        <button 
          type="button" 
          class="btn btn-primary" 
          [disabled]="completedCount === 0"
          (click)="downloadZip.emit()"
        >
          📦 Download All as ZIP
        </button>
      </div>
    </div>
  `,
  styles: [`
    .actions-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 16px;
      padding: 16px 24px;
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: 12px;
    }

    .stats-summary {
      display: flex;
      align-items: center;
      gap: 20px;
    }

    .stat-item {
      display: flex;
      flex-direction: column;
    }

    .stat-value {
      font-size: 1.1rem;
      font-weight: 700;
      color: #f8fafc;
    }

    .stat-value.highlight {
      color: #34d399;
    }

    .stat-label {
      font-size: 0.75rem;
      color: #94a3b8;
      text-transform: uppercase;
    }

    .stat-divider {
      width: 1px;
      height: 24px;
      background: rgba(255, 255, 255, 0.1);
    }

    .button-group {
      display: flex;
      gap: 12px;
    }

    .btn {
      padding: 10px 20px;
      border-radius: 8px;
      font-size: 0.9rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
      border: none;
    }

    .btn-secondary {
      background: rgba(255, 255, 255, 0.08);
      color: #cbd5e1;
    }

    .btn-secondary:hover:not(:disabled) {
      background: rgba(255, 255, 255, 0.15);
      color: #ffffff;
    }

    .btn-primary {
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      color: #ffffff;
      box-shadow: 0 4px 14px rgba(16, 185, 129, 0.3);
    }

    .btn-primary:hover:not(:disabled) {
      background: linear-gradient(135deg, #059669 0%, #047857 100%);
    }

    .btn:disabled {
      opacity: 0.4;
      cursor: not-allowed;
      box-shadow: none;
    }
  `]
})
export class ResultsActionsComponent {
  @Input() completedCount = 0;
  @Input() totalCount = 0;
  @Input() totalOriginalBytes = 0;
  @Input() totalCompressedBytes = 0;

  @Output() downloadZip = new EventEmitter<void>();
  @Output() clearAll = new EventEmitter<void>();

  get savedBytes(): number {
    return Math.max(0, this.totalOriginalBytes - this.totalCompressedBytes);
  }

  get totalSavingsPercentage(): number {
    if (this.totalOriginalBytes === 0) return 0;
    return Math.max(0, Math.round((this.savedBytes / this.totalOriginalBytes) * 100));
  }

  formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }
}
