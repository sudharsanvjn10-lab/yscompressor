import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DragDropModule, CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { FormsModule } from '@angular/forms';

export interface ImageToPdfSettings {
  files: File[];
  pageSize: 'a4' | 'letter' | 'auto';
}

@Component({
  selector: 'app-image-to-pdf',
  standalone: true,
  imports: [CommonModule, DragDropModule, FormsModule],
  template: `
    <div class="pdf-builder-card">
      <div class="card-header">
        <h4>📄 Image ➔ PDF Builder</h4>
        <span class="sub-text">Drag items to reorder pages in the output document</span>
      </div>

      <!-- Controls -->
      <div class="controls-row">
        <div class="setting-group">
          <label>Target Page Size</label>
          <select [(ngModel)]="pageSize" class="select-input">
            <option value="a4">A4 (Standard ISO)</option>
            <option value="letter">US Letter</option>
            <option value="auto">Auto-Fit to Image Aspect Ratio</option>
          </select>
        </div>

        <button 
          type="button" 
          class="btn-file-select" 
          (click)="pdfFileInput.click()"
        >
          ➕ Add Images
        </button>
        <input 
          #pdfFileInput 
          type="file" 
          multiple 
          accept="image/jpeg,image/png,image/webp" 
          (change)="onFilesSelected($event)" 
          style="display: none;" 
        />
      </div>

      <!-- Reorderable List -->
      @if (fileList.length > 0) {
        <div 
          cdkDropList 
          (cdkDropListDropped)="onDropReorder($event)" 
          class="reorder-list"
        >
          @for (file of fileList; track file.name; let idx = $index) {
            <div cdkDrag class="reorder-item">
              <span class="drag-handle">::</span>
              <span class="page-num">Page {{ idx + 1 }}</span>
              <span class="file-title">{{ file.name }}</span>
              <span class="file-size">{{ formatBytes(file.size) }}</span>
              <button type="button" class="remove-btn" (click)="removeFile(idx)">✕</button>
            </div>
          }
        </div>

        <div class="action-footer">
          <button 
            type="button" 
            class="btn-generate" 
            (click)="generatePdf()"
          >
            🚀 Generate PDF Document ({{ fileList.length }} pages)
          </button>
        </div>
      } @else {
        <div class="empty-pdf-state" (click)="pdfFileInput.click()">
          <p>No images added yet. Click here or use the button above to add images for PDF compilation.</p>
        </div>
      }
    </div>
  `,
  styles: [`
    .pdf-builder-card {
      background: rgba(30, 41, 59, 0.6);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 12px;
      padding: 20px;
      backdrop-filter: blur(10px);
      margin-bottom: 24px;
    }

    .card-header h4 {
      margin: 0;
      color: #f8fafc;
      font-size: 1.05rem;
    }

    .sub-text {
      font-size: 0.8rem;
      color: #94a3b8;
    }

    .controls-row {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      margin: 16px 0;
    }

    .setting-group {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .setting-group label {
      font-size: 0.8rem;
      color: #cbd5e1;
    }

    .select-input {
      background: rgba(15, 23, 42, 0.7);
      border: 1px solid rgba(255, 255, 255, 0.15);
      border-radius: 8px;
      padding: 8px 12px;
      color: #f8fafc;
      font-size: 0.85rem;
    }

    .btn-file-select {
      background: rgba(99, 102, 241, 0.2);
      border: 1px solid rgba(99, 102, 241, 0.4);
      color: #818cf8;
      padding: 8px 16px;
      border-radius: 8px;
      font-weight: 500;
      cursor: pointer;
    }

    .reorder-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
      margin-bottom: 16px;
    }

    .reorder-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 10px 14px;
      background: rgba(15, 23, 42, 0.6);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 8px;
      cursor: move;
    }

    .drag-handle {
      color: #64748b;
      font-weight: bold;
    }

    .page-num {
      font-size: 0.75rem;
      padding: 2px 8px;
      background: rgba(99, 102, 241, 0.15);
      color: #818cf8;
      border-radius: 4px;
      font-weight: 600;
    }

    .file-title {
      flex: 1;
      font-size: 0.85rem;
      color: #f1f5f9;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .file-size {
      font-size: 0.75rem;
      color: #64748b;
      font-family: monospace;
    }

    .remove-btn {
      background: transparent;
      border: none;
      color: #f87171;
      cursor: pointer;
      font-size: 1rem;
    }

    .action-footer {
      display: flex;
      justify-content: flex-end;
    }

    .btn-generate {
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      color: #ffffff;
      border: none;
      padding: 10px 20px;
      border-radius: 8px;
      font-weight: 600;
      font-size: 0.9rem;
      cursor: pointer;
      box-shadow: 0 4px 14px rgba(16, 185, 129, 0.3);
    }

    .empty-pdf-state {
      padding: 32px;
      border: 2px dashed rgba(255, 255, 255, 0.1);
      border-radius: 10px;
      text-align: center;
      color: #64748b;
      cursor: pointer;
      font-size: 0.9rem;
    }
  `]
})
export class ImageToPdfComponent {
  @Output() startPdfGeneration = new EventEmitter<ImageToPdfSettings>();

  fileList: File[] = [];
  pageSize: 'a4' | 'letter' | 'auto' = 'a4';

  onFilesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      this.fileList.push(...Array.from(input.files));
      input.value = '';
    }
  }

  onDropReorder(event: CdkDragDrop<File[]>): void {
    moveItemInArray(this.fileList, event.previousIndex, event.currentIndex);
  }

  removeFile(index: number): void {
    this.fileList.splice(index, 1);
  }

  generatePdf(): void {
    if (this.fileList.length === 0) return;
    this.startPdfGeneration.emit({
      files: [...this.fileList],
      pageSize: this.pageSize
    });
  }

  formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }
}
