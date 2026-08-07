import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ImageJob } from '../../models/image-job.model';

@Component({
  selector: 'app-batch-queue',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (jobs.length > 0) {
      <div class="queue-container">
        <!-- Header -->
        <div class="queue-header">
          <div class="col col-file">File</div>
          <div class="col col-format">Format</div>
          <div class="col col-size">Original / Compressed</div>
          <div class="col col-savings">Savings</div>
          <div class="col col-status">Status</div>
          <div class="col col-action">Action</div>
        </div>

        <!-- Virtualized List Container -->
        <div class="queue-list">
          @for (job of jobs; track job.id) {
            <div 
              class="queue-row" 
              [class.done]="job.status === 'done'" 
              [class.error]="job.status === 'error'"
              [class.selected]="job.id === selectedJobId"
              (click)="onRowClick(job)"
              title="Click to inspect visual quality comparison"
            >
              <!-- Thumbnail & File Name -->
              <div class="col col-file">
                @if (job.thumbnailUrl) {
                  <img [src]="job.thumbnailUrl" class="row-thumb" alt="Thumbnail" />
                } @else {
                  <div class="row-thumb-placeholder">📄</div>
                }
                <div class="file-info">
                  <span class="file-name" [title]="job.name">{{ job.name }}</span>
                  <span class="processing-time">
                    @if (job.durationMs) {
                      {{ job.durationMs }}ms
                    }
                  </span>
                </div>
              </div>

              <!-- Format Badge -->
              <div class="col col-format">
                <span class="format-badge">{{ getFormatBadge(job) }}</span>
              </div>

              <!-- Original vs Compressed Size -->
              <div class="col col-size">
                <span class="orig-size">{{ formatBytes(job.originalSize) }}</span>
                @if (job.status === 'done') {
                  @if (getCompressedSize(job); as cSize) {
                    <span class="arrow">➔</span>
                    <span class="comp-size">{{ formatBytes(cSize) }}</span>
                  }
                }
              </div>

              <!-- Savings Badge -->
              <div class="col col-savings">
                @if (job.status === 'done' && getReductionPercentage(job) !== undefined) {
                  <span class="saving-badge" [class.positive]="getReductionPercentage(job)! > 0">
                    -{{ getReductionPercentage(job) }}%
                  </span>
                } @else {
                  <span class="saving-dash">-</span>
                }
              </div>

              <!-- Status Badge -->
              <div class="col col-status">
                @switch (job.status) {
                  @case ('queued') {
                    <span class="status-pill status-queued">Queued</span>
                  }
                  @case ('processing') {
                    <span class="status-pill status-processing">Processing...</span>
                  }
                  @case ('done') {
                    <span class="status-pill status-done">Done</span>
                  }
                  @case ('error') {
                    <span class="status-pill status-error" [title]="job.errorMessage || 'Error'">
                      Failed
                    </span>
                  }
                }
              </div>

              <!-- Actions -->
              <div class="col col-action" (click)="$event.stopPropagation()">
                @if (hasOutput(job)) {
                  <button type="button" class="btn-download-single" (click)="downloadSingle.emit(job)" title="Download Output">
                    📥
                  </button>
                }
              </div>
            </div>
          }
        </div>
      </div>
    }
  `,
  styles: [`
    .queue-row.done {
      background: var(--bg-card);
    }

    .queue-row.selected {
      border: 2px solid var(--accent-color, #6366f1);
      background: rgba(99, 102, 241, 0.05);
    }

    .queue-row.error {
    }

    .queue-container {
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: 12px;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      margin-bottom: 24px;
    }

    .queue-header {
      display: flex;
      align-items: center;
      padding: 12px 16px;
      background: var(--bg-secondary);
      border-bottom: 1px solid var(--border-color);
      font-size: 0.8rem;
      font-weight: 600;
      color: var(--text-secondary);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .queue-list {
      max-height: 480px;
      overflow-y: auto;
    }

    .queue-row {
      display: flex;
      align-items: center;
      padding: 12px 16px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.05);
      transition: background 0.15s ease;
      cursor: pointer;
    }

    .queue-row:last-child {
      border-bottom: none;
    }

    .queue-row:hover {
      background: rgba(99, 102, 241, 0.08);
    }

    .col {
      display: flex;
      align-items: center;
    }

    .col-file {
      flex: 3;
      gap: 12px;
      min-width: 0;
    }

    .col-format { flex: 1; }
    .col-size { flex: 2.5; gap: 6px; font-family: monospace; font-size: 0.85rem; }
    .col-savings { flex: 1.2; }
    .col-status { flex: 1.5; }
    .col-action { flex: 1; justify-content: flex-end; }

    .row-thumb {
      width: 40px;
      height: 40px;
      border-radius: 6px;
      object-fit: cover;
      border: 1px solid rgba(255, 255, 255, 0.1);
    }

    .row-thumb-placeholder {
      width: 40px;
      height: 40px;
      border-radius: 6px;
      background: rgba(255, 255, 255, 0.05);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.2rem;
    }

    .file-info {
      display: flex;
      flex-direction: column;
      min-width: 0;
    }

    .file-name {
      font-size: 0.9rem;
      font-weight: 500;
      color: var(--text-primary);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .processing-time {
      font-size: 0.75rem;
      color: var(--text-secondary);
    }

    .format-badge {
      padding: 3px 8px;
      border-radius: 4px;
      font-size: 0.7rem;
      font-weight: 700;
      background: rgba(99, 102, 241, 0.15);
      color: #a5b4fc;
      border: 1px solid rgba(99, 102, 241, 0.3);
    }

    .orig-size { color: var(--text-secondary); }
    .arrow { color: var(--text-secondary); }
    .comp-size { color: #34d399; font-weight: 600; }

    .saving-badge {
      padding: 3px 8px;
      border-radius: 4px;
      font-size: 0.75rem;
      font-weight: 700;
      background: rgba(239, 68, 68, 0.15);
      color: #fca5a5;
    }

    .saving-badge.positive {
      background: rgba(16, 185, 129, 0.15);
      color: #6ee7b7;
    }

    .saving-dash { color: var(--text-secondary); }

    .status-pill {
      padding: 4px 10px;
      border-radius: 9999px;
      font-size: 0.75rem;
      font-weight: 600;
    }

    .status-queued {
      background: rgba(148, 163, 184, 0.15);
      color: #cbd5e1;
    }

    .status-processing {
      background: rgba(59, 130, 246, 0.15);
      color: #93c5fd;
      animation: pulse 1.5s infinite;
    }

    .status-done {
      background: rgba(16, 185, 129, 0.15);
      color: #6ee7b7;
    }

    .status-error {
      background: rgba(239, 68, 68, 0.15);
      color: #fca5a5;
    }

    .btn-download-single {
      background: rgba(99, 102, 241, 0.2);
      border: 1px solid rgba(99, 102, 241, 0.4);
      color: #818cf8;
      border-radius: 6px;
      padding: 6px 10px;
      cursor: pointer;
      font-size: 0.9rem;
      transition: all 0.2s ease;
    }

    .btn-download-single:hover {
      background: rgba(99, 102, 241, 0.4);
      color: #ffffff;
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }
  `]
})
export class BatchQueueComponent {
  @Input() jobs: ImageJob[] = [];
  @Input() selectedJobId?: string;
  @Output() downloadSingle = new EventEmitter<ImageJob>();
  @Output() selectJobForComparison = new EventEmitter<ImageJob>();

  onRowClick(job: ImageJob): void {
    if (job.status === 'done') {
      this.selectJobForComparison.emit(job);
    }
  }

  getFormatBadge(job: ImageJob): string {
    if (job.type === 'img-to-pdf') return 'PDF';
    if (job.type === 'pdf-to-img') return (job.outputFormat || 'png').toUpperCase();
    return (job as any).format ? (job as any).format.toUpperCase() : 'AUTO';
  }

  getCompressedSize(job: ImageJob): number | undefined {
    if (job.type === 'img-to-pdf') return job.outputPdfBlob ? job.outputPdfBlob.size : undefined;
    if (job.type === 'pdf-to-img') {
      if (job.renderedPages && job.renderedPages.length > 0) {
        return job.renderedPages.reduce((sum, p) => sum + p.blob.size, 0);
      }
      return undefined;
    }
    return (job as any).compressedSize;
  }

  getReductionPercentage(job: ImageJob): number | undefined {
    if (job.type === 'img-to-pdf' || job.type === 'pdf-to-img') return undefined;
    return (job as any).reductionPercentage;
  }

  hasOutput(job: ImageJob): boolean {
    if (job.status !== 'done') return false;
    if (job.type === 'img-to-pdf') return !!job.outputPdfBlob;
    if (job.type === 'pdf-to-img') return !!(job.renderedPages && job.renderedPages.length > 0);
    return !!(job as any).compressedBlob;
  }

  formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }
}
