import { Component, EventEmitter, Output, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DeviceCapabilityService, PdfRiskEvaluation } from '../../core/device-capability.service';

export interface PdfToImageSettings {
  pdfFile: File;
  outputFormat: 'png' | 'jpeg';
  scale: number;
}

@Component({
  selector: 'app-pdf-to-image',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="pdf-extract-card">
      <div class="card-header">
        <h4>🖼️ PDF ➔ Image Extractor</h4>
        <span class="sub-text">Windowed pagination rendering for memory safety</span>
      </div>

      <!-- File Picker & Risk Banner -->
      <div class="file-picker-area">
        <button 
          type="button" 
          class="btn-pick-pdf" 
          (click)="pdfInput.click()"
        >
          📂 Select PDF File
        </button>
        <input 
          #pdfInput 
          type="file" 
          accept="application/pdf" 
          (change)="onPdfSelected($event)" 
          style="display: none;" 
        />

        @if (selectedFile) {
          <div class="file-details-badge">
            📄 {{ selectedFile.name }} ({{ formatBytes(selectedFile.size) }})
          </div>
        }
      </div>

      @if (riskEvaluation?.warningMessage) {
        <div class="risk-warning" [class.danger]="riskEvaluation?.isHighRisk">
          ⚠️ {{ riskEvaluation?.warningMessage }}
        </div>
      }

      <!-- Export Settings -->
      @if (selectedFile) {
        <div class="settings-row">
          <div class="setting-item">
            <label>Output Format</label>
            <select [(ngModel)]="outputFormat" class="select-input">
              <option value="png">PNG (Lossless High Quality)</option>
              <option value="jpeg">JPEG (Compressed Photo)</option>
            </select>
          </div>

          <div class="setting-item">
            <label>Resolution Scale</label>
            <select [(ngModel)]="scale" class="select-input">
              <option [ngValue]="1">1x Standard DPI</option>
              <option [ngValue]="2">2x High Retinal DPI</option>
              <option [ngValue]="3">3x Ultra DPI</option>
            </select>
          </div>

          <button 
            type="button" 
            class="btn-start-extract" 
            (click)="startExtract()"
          >
            ⚡ Start Page Extraction
          </button>
        </div>
      }
    </div>
  `,
  styles: [`
    .pdf-extract-card {
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

    .file-picker-area {
      display: flex;
      align-items: center;
      gap: 16px;
      margin: 16px 0;
    }

    .btn-pick-pdf {
      background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
      color: #ffffff;
      border: none;
      padding: 10px 18px;
      border-radius: 8px;
      font-weight: 500;
      cursor: pointer;
    }

    .file-details-badge {
      background: rgba(15, 23, 42, 0.6);
      border: 1px solid rgba(255, 255, 255, 0.1);
      padding: 8px 14px;
      border-radius: 8px;
      color: #f1f5f9;
      font-size: 0.85rem;
    }

    .risk-warning {
      padding: 10px 14px;
      background: rgba(245, 158, 11, 0.15);
      border: 1px solid rgba(245, 158, 11, 0.3);
      color: #fbbf24;
      border-radius: 8px;
      font-size: 0.85rem;
      margin-bottom: 16px;
    }

    .risk-warning.danger {
      background: rgba(239, 68, 68, 0.15);
      border-color: rgba(239, 68, 68, 0.3);
      color: #f87171;
    }

    .settings-row {
      display: flex;
      align-items: flex-end;
      gap: 16px;
      flex-wrap: wrap;
    }

    .setting-item {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .setting-item label {
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

    .btn-start-extract {
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      color: #ffffff;
      border: none;
      padding: 10px 20px;
      border-radius: 8px;
      font-weight: 600;
      font-size: 0.9rem;
      cursor: pointer;
    }
  `]
})
export class PdfToImageComponent {
  @Output() startExtraction = new EventEmitter<PdfToImageSettings>();

  selectedFile: File | null = null;
  outputFormat: 'png' | 'jpeg' = 'png';
  scale = 2;
  riskEvaluation: PdfRiskEvaluation | null = null;

  constructor(private deviceCap: DeviceCapabilityService) {}

  onPdfSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      this.selectedFile = input.files[0];
      // Estimate page count for pre-inspection risk check
      const estimatedPages = Math.ceil(this.selectedFile.size / (1024 * 100));
      this.riskEvaluation = this.deviceCap.evaluatePdfRisk(estimatedPages);
      input.value = '';
    }
  }

  startExtract(): void {
    if (!this.selectedFile) return;
    this.startExtraction.emit({
      pdfFile: this.selectedFile,
      outputFormat: this.outputFormat,
      scale: this.scale
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
