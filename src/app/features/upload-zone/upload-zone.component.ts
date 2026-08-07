import { Component, EventEmitter, Output, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-upload-zone',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div 
      class="upload-dropzone"
      [class.drag-over]="isDragging"
      [class.disabled]="disabled"
      (dragover)="onDragOver($event)"
      (dragleave)="onDragLeave($event)"
      (drop)="onDrop($event)"
      (click)="fileInput.click()"
    >
      <input 
        #fileInput 
        type="file" 
        multiple 
        accept="image/jpeg,image/png,image/webp" 
        (change)="onFileSelected($event)" 
        style="display: none;" 
      />

      <div class="dropzone-content">
        <div class="icon-wrapper">
          <svg class="upload-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
        </div>
        
        <h3 class="title">Drag & Drop your images here</h3>
        <p class="subtitle">Supports JPEG, PNG, and WebP up to <strong>{{ maxBatchSize }} images</strong> per batch</p>

        <div class="action-btn">
          <span>Choose Files</span>
        </div>

        @if (batchWarning) {
          <div class="batch-warning">
            ⚠️ {{ batchWarning }}
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .upload-dropzone {
      border-radius: 16px;
      padding: 40px 24px;
      text-align: center;
      background: var(--bg-card, rgba(30, 27, 75, 0.4));
      border: 2px dashed var(--accent-color, #6366f1);
      cursor: pointer;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      position: relative;
      overflow: hidden;
    }

    .upload-dropzone:hover {
      border-color: #6366f1;
      transform: translateY(-2px);
      box-shadow: 0 12px 30px -10px rgba(99, 102, 241, 0.3);
    }

    .upload-dropzone.drag-over {
      border-color: #10b981;
      background: rgba(16, 185, 129, 0.1);
      transform: scale(1.01);
    }

    .upload-dropzone.disabled {
      opacity: 0.5;
      pointer-events: none;
    }

    .dropzone-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;
    }

    .icon-wrapper {
      width: 64px;
      height: 64px;
      border-radius: 50%;
      background: rgba(99, 102, 241, 0.15);
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 8px;
    }

    .upload-icon {
      width: 32px;
      height: 32px;
      color: #818cf8;
    }

    .title {
      font-size: 1.25rem;
      font-weight: 600;
      color: #f8fafc;
      margin: 0;
    }

    .subtitle {
      font-size: 0.9rem;
      color: #94a3b8;
      margin: 0;
    }

    .action-btn {
      margin-top: 8px;
      padding: 10px 24px;
      background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
      color: #ffffff;
      border-radius: 8px;
      font-weight: 500;
      font-size: 0.95rem;
      box-shadow: 0 4px 14px rgba(99, 102, 241, 0.4);
      transition: all 0.2s ease;
    }

    .action-btn:hover {
      background: linear-gradient(135deg, #4f46e5 0%, #4338ca 100%);
    }

    .batch-warning {
      margin-top: 12px;
      padding: 8px 16px;
      background: rgba(245, 158, 11, 0.15);
      border: 1px solid rgba(245, 158, 11, 0.3);
      color: #fbbf24;
      border-radius: 6px;
      font-size: 0.85rem;
    }
  `]
})
export class UploadZoneComponent {
  @Input() maxBatchSize = 20;
  @Input() disabled = false;
  @Output() filesSelected = new EventEmitter<File[]>();

  isDragging = false;
  batchWarning: string | null = null;

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;

    if (event.dataTransfer?.files) {
      this.handleFiles(Array.from(event.dataTransfer.files));
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      this.handleFiles(Array.from(input.files));
      input.value = ''; // Reset input
    }
  }

  private handleFiles(files: File[]): void {
    this.batchWarning = null;
    const validFiles = files.filter(f => f.type.startsWith('image/'));

    if (validFiles.length === 0) {
      this.batchWarning = 'No supported image files detected. Please choose JPEG, PNG, or WebP images.';
      return;
    }

    if (validFiles.length > this.maxBatchSize) {
      this.batchWarning = `Selected ${validFiles.length} files. Batch capped to max allowed ${this.maxBatchSize} images.`;
      this.filesSelected.emit(validFiles.slice(0, this.maxBatchSize));
    } else {
      this.filesSelected.emit(validFiles);
    }
  }
}
