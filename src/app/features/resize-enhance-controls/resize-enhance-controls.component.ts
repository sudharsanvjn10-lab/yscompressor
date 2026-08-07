import { Component, EventEmitter, Output, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CodecLoaderService } from '../../core/codec-loader.service';

export interface ResizeEnhanceSettings {
  targetWidth: number;
  targetHeight: number;
  maintainAspectRatio: boolean;
  sharpen: number;
  contrast: number;
  noiseReduction: number;
}

@Component({
  selector: 'app-resize-enhance-controls',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="controls-panel">
      <!-- Fallback Warning Banner if Magick Wasm chunk failed -->
      @if (codecLoader.magickLoadFailed()) {
        <div class="fallback-banner">
          ⚠️ <strong>Advanced Engine Notice:</strong> Wasm filter engine could not be initialized.
          Basic canvas sharpen, contrast, and resizing remain fully active.
        </div>
      }

      <div class="panel-section">
        <h4 class="section-title">📐 Dimension Resizing</h4>

        <div class="presets-row">
          <button type="button" class="preset-btn" (click)="applyPreset(1920, 1080)">
            1080p FHD
          </button>
          <button type="button" class="preset-btn" (click)="applyPreset(1280, 720)">720p HD</button>
          <button type="button" class="preset-btn" (click)="applyPreset(3840, 2160)">4K UHD</button>
          <button type="button" class="preset-btn" (click)="applyPreset(150, 150)">
            Thumbnail
          </button>
        </div>

        <div class="inputs-row">
          <div class="input-group">
            <label>Width (px)</label>
            <input
              type="number"
              [(ngModel)]="settings.targetWidth"
              (ngModelChange)="onWidthChange()"
              min="1"
              max="8000"
              class="num-input"
            />
          </div>

          <div class="aspect-link">
            <button
              type="button"
              class="lock-btn"
              [class.locked]="settings.maintainAspectRatio"
              (click)="toggleAspectRatio()"
              title="Lock Aspect Ratio"
            >
              {{ settings.maintainAspectRatio ? '🔒' : '🔓' }}
            </button>
          </div>

          <div class="input-group">
            <label>Height (px)</label>
            <input
              type="number"
              [(ngModel)]="settings.targetHeight"
              (ngModelChange)="onHeightChange()"
              min="1"
              max="8000"
              class="num-input"
            />
          </div>
        </div>

        @if (validationError) {
          <div class="validation-error">⚠️ {{ validationError }}</div>
        }
      </div>

      <div class="divider"></div>

      <div class="panel-section">
        <h4 class="section-title">✨ Quality Enhancement Filters</h4>

        <div class="sliders-grid">
          <!-- Sharpen -->
          <div class="slider-item">
            <div class="slider-header">
              <label>Sharpen</label>
              <span>{{ settings.sharpen }}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              [(ngModel)]="settings.sharpen"
              (ngModelChange)="emitSettings()"
              class="slider"
            />
          </div>

          <!-- Contrast -->
          <div class="slider-item">
            <div class="slider-header">
              <label>Contrast</label>
              <span>{{ settings.contrast > 0 ? '+' + settings.contrast : settings.contrast }}</span>
            </div>
            <input
              type="range"
              min="-50"
              max="50"
              [(ngModel)]="settings.contrast"
              (ngModelChange)="emitSettings()"
              class="slider"
            />
          </div>

          <!-- Noise Reduction -->
          <div class="slider-item">
            <div class="slider-header">
              <label>Noise Reduction</label>
              <span>{{ settings.noiseReduction }}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              [(ngModel)]="settings.noiseReduction"
              (ngModelChange)="emitSettings()"
              class="slider"
            />
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
    .controls-panel {
      background: rgba(30, 41, 59, 0.6);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 12px;
      padding: 20px;
      backdrop-filter: blur(10px);
      margin-bottom: 24px;
    }

    .fallback-banner {
      background: rgba(245, 158, 11, 0.15);
      border: 1px solid rgba(245, 158, 11, 0.3);
      color: #fbbf24;
      padding: 10px 14px;
      border-radius: 8px;
      font-size: 0.85rem;
      margin-bottom: 16px;
    }

    .section-title {
      font-size: 0.95rem;
      font-weight: 600;
      color: #f8fafc;
      margin-bottom: 12px;
    }

    .presets-row {
      display: flex;
      gap: 8px;
      margin-bottom: 14px;
      flex-wrap: wrap;
    }

    .preset-btn {
      padding: 6px 12px;
      background: rgba(15, 23, 42, 0.6);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 6px;
      color: #cbd5e1;
      font-size: 0.8rem;
      cursor: pointer;
    }

    .preset-btn:hover {
      background: #6366f1;
      color: #fff;
    }

    .inputs-row {
      display: flex;
      align-items: flex-end;
      gap: 12px;
    }

    .input-group {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .input-group label {
      font-size: 0.75rem;
      color: #94a3b8;
    }

    .num-input {
      background: rgba(15, 23, 42, 0.7);
      border: 1px solid rgba(255, 255, 255, 0.15);
      border-radius: 6px;
      padding: 8px 12px;
      color: #f8fafc;
      width: 120px;
      font-family: monospace;
    }

    .lock-btn {
      background: rgba(255, 255, 255, 0.08);
      border: 1px solid rgba(255, 255, 255, 0.1);
      padding: 8px 12px;
      border-radius: 6px;
      cursor: pointer;
    }

    .lock-btn.locked {
      background: rgba(99, 102, 241, 0.2);
      border-color: #6366f1;
    }

    .validation-error {
      margin-top: 10px;
      color: #f87171;
      font-size: 0.85rem;
    }

    .divider {
      height: 1px;
      background: rgba(255, 255, 255, 0.08);
      margin: 18px 0;
    }

    .sliders-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 16px;
    }

    .slider-item {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .slider-header {
      display: flex;
      justify-content: space-between;
      font-size: 0.8rem;
    }
    .slider {
      accent-color: #6366f1;
      cursor: pointer;
    }
  `,
  ],
})
export class ResizeEnhanceControlsComponent {
  @Output() settingsChanged = new EventEmitter<ResizeEnhanceSettings>();

  private _settings: ResizeEnhanceSettings = {
    targetWidth: 1920,
    targetHeight: 1080,
    maintainAspectRatio: true,
    sharpen: 0,
    contrast: 0,
    noiseReduction: 0,
  };

  @Input() set settings(val: ResizeEnhanceSettings | undefined | null) {
    if (val) {
      this._settings = { ...val };
    }
  }

  get settings(): ResizeEnhanceSettings {
    return this._settings;
  }

  aspectRatio = 1920 / 1080;
  validationError: string | null = null;

  constructor(public codecLoader: CodecLoaderService) {}

  toggleAspectRatio(): void {
    this.settings.maintainAspectRatio = !this.settings.maintainAspectRatio;
    this.emitSettings();
  }

  applyPreset(w: number, h: number): void {
    this.settings.targetWidth = w;
    this.settings.targetHeight = h;
    this.aspectRatio = w / h;
    this.validateAndEmit();
  }

  onWidthChange(): void {
    if (this.settings.maintainAspectRatio && this.aspectRatio) {
      this.settings.targetHeight = Math.round(this.settings.targetWidth / this.aspectRatio);
    }
    this.validateAndEmit();
  }

  onHeightChange(): void {
    if (this.settings.maintainAspectRatio && this.aspectRatio) {
      this.settings.targetWidth = Math.round(this.settings.targetHeight * this.aspectRatio);
    }
    this.validateAndEmit();
  }

  validateAndEmit(): void {
    this.validationError = null;
    if (this.settings.targetWidth > 8000 || this.settings.targetHeight > 8000) {
      this.validationError = 'Target dimensions cannot exceed 8000px on either side.';
      return;
    }
    this.emitSettings();
  }

  emitSettings(): void {
    this.settingsChanged.emit({ ...this.settings });
  }
}
