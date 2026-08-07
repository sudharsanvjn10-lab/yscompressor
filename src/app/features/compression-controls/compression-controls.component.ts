import { Component, EventEmitter, Output, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CompressionSettings, ImageFormat } from '../../models/image-job.model';

@Component({
  selector: 'app-compression-controls',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="controls-card">
      <div class="controls-header">
        <h4 class="title">Compression Settings</h4>
        <span class="auto-badge">Auto-starts on drop</span>
      </div>

      <!-- Compression Target Mode: Quality vs Max File Size (KB) -->
      <div class="mode-selection-row">
        <label class="radio-label">
          <input 
            type="radio" 
            name="compressionMode" 
            value="quality" 
            [(ngModel)]="settings.mode" 
            (change)="emitSettings()"
          />
          Quality (%)
        </label>

        <label class="radio-label">
          <input 
            type="radio" 
            name="compressionMode" 
            value="targetSize" 
            [(ngModel)]="settings.mode" 
            (change)="emitSettings()"
          />
          Max File Size (KB)
        </label>
      </div>

      <div class="settings-grid">
        <!-- Target Format -->
        <div class="setting-item">
          <label class="label">Target Format</label>
          <div class="format-toggle">
            <button 
              type="button" 
              class="toggle-btn" 
              [class.active]="settings.format === 'jpeg'"
              (click)="setFormat('jpeg')"
            >
              JPEG
            </button>
            <button 
              type="button" 
              class="toggle-btn" 
              [class.active]="settings.format === 'webp'"
              (click)="setFormat('webp')"
            >
              WebP
            </button>
            <button 
              type="button" 
              class="toggle-btn" 
              [class.active]="settings.format === 'png'"
              (click)="setFormat('png')"
            >
              PNG
            </button>
          </div>
        </div>

        <!-- Quality or Max File Size Control -->
        <div class="setting-item">
          @if (settings.mode === 'targetSize') {
            <div class="slider-header">
              <label class="label">Target Max Size</label>
              <span class="value-badge">{{ settings.targetSizeKb }} KB</span>
            </div>
            <input 
              type="number" 
              min="10" 
              max="50000" 
              [(ngModel)]="settings.targetSizeKb"
              (ngModelChange)="emitSettings()" 
              class="input-kb"
              placeholder="e.g. 500 KB"
            />
          } @else if (settings.format === 'jpeg') {
            <div class="slider-header">
              <label class="label">JPEG Quality</label>
              <span class="value-badge">{{ settings.jpegQuality }}%</span>
            </div>
            <input 
              type="range" 
              min="1" 
              max="100" 
              [(ngModel)]="settings.jpegQuality"
              (ngModelChange)="emitSettings()" 
              class="slider"
            />
          } @else if (settings.format === 'webp') {
            <div class="slider-header">
              <label class="label">WebP Quality</label>
              <span class="value-badge">{{ settings.webpQuality }}%</span>
            </div>
            <input 
              type="range" 
              min="1" 
              max="100" 
              [(ngModel)]="settings.webpQuality"
              (ngModelChange)="emitSettings()" 
              class="slider"
            />
          } @else if (settings.format === 'png') {
            <div class="checkbox-wrapper">
              <label class="label">PNG Strategy</label>
              <label class="checkbox-label">
                <input 
                  type="checkbox" 
                  [(ngModel)]="settings.pngLossless" 
                  (ngModelChange)="emitSettings()"
                />
                Lossless PNG encoding
              </label>
            </div>
          }
        </div>
      </div>
    </div>
  `,
  styles: [`
    .controls-card {
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: 12px;
      padding: 16px 20px;
      margin-bottom: 24px;
    }

    .controls-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
    }

    .title {
      font-size: 1rem;
      font-weight: 600;
      color: var(--text-primary);
      margin: 0;
    }

    .auto-badge {
      font-size: 0.75rem;
      padding: 4px 8px;
      background: rgba(16, 185, 129, 0.15);
      color: #34d399;
      border-radius: 9999px;
      font-weight: 500;
    }

    .mode-selection-row {
      display: flex;
      gap: 20px;
      margin-bottom: 16px;
      padding-bottom: 12px;
      border-bottom: 1px solid var(--border-color);
    }

    .radio-label {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 0.85rem;
      color: var(--text-primary);
      cursor: pointer;
      font-weight: 500;
    }

    .settings-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 20px;
    }

    .setting-item {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .label {
      font-size: 0.85rem;
      font-weight: 500;
      color: var(--text-secondary);
    }

    .format-toggle {
      display: flex;
      background: var(--bg-secondary);
      padding: 4px;
      border-radius: 8px;
      border: 1px solid var(--border-color);
    }

    .toggle-btn {
      flex: 1;
      padding: 6px 12px;
      border: none;
      background: transparent;
      color: var(--text-secondary);
      font-size: 0.85rem;
      font-weight: 500;
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .toggle-btn.active {
      background: var(--accent-color, #6366f1);
      color: #ffffff;
      box-shadow: 0 2px 8px rgba(99, 102, 241, 0.4);
    }

    .slider-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .value-badge {
      font-size: 0.85rem;
      font-weight: 600;
      color: var(--accent-color, #818cf8);
    }

    .slider {
      width: 100%;
      accent-color: #6366f1;
      cursor: pointer;
    }

    .input-kb {
      background: var(--bg-secondary);
      border: 1px solid var(--border-color);
      color: var(--text-primary);
      padding: 8px 12px;
      border-radius: 8px;
      font-size: 0.9rem;
    }

    .checkbox-wrapper {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .checkbox-label {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 0.85rem;
      color: var(--text-primary);
      cursor: pointer;
    }
  `]
})
export class CompressionControlsComponent {
  @Output() settingsChanged = new EventEmitter<CompressionSettings>();

  private _settings: CompressionSettings = {
    format: 'jpeg',
    mode: 'quality',
    jpegQuality: 82,
    webpQuality: 80,
    pngLossless: true,
    targetSizeKb: 500
  };

  @Input() set settings(val: CompressionSettings | undefined | null) {
    if (val) {
      this._settings = { ...val };
    }
  }

  get settings(): CompressionSettings {
    return this._settings;
  }

  setFormat(format: ImageFormat): void {
    this.settings.format = format;
    this.emitSettings();
  }

  emitSettings(): void {
    this.settingsChanged.emit({ ...this.settings });
  }
}
