import { Component, Output, EventEmitter, OnInit, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ImageFormat } from '../../models/image-job.model';

export interface CropRotateSettings {
  cropWidth: number;
  cropHeight: number;
  positionX: number;
  positionY: number;
  aspectRatio: 'free' | '1:1' | '16:9' | '4:3' | '9:16';
  rotationAngle: number;
  flipHorizontal: boolean;
  flipVertical: boolean;
  format: ImageFormat;
  quality: number;
}

@Component({
  selector: 'app-crop-rotate-controls',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="crop-controls-card">
      <div class="controls-grid">
        <!-- Section 1: Crop Rectangle & Aspect Ratio -->
        <div class="control-section">
          <h4>✂️ Crop Rectangle</h4>

          <div class="input-row">
            <div class="field-group">
              <label>Width (px)</label>
              <input type="number" [(ngModel)]="cropWidth" (change)="onDimensionsChanged()" min="10" />
            </div>

            <div class="field-group">
              <label>Height (px)</label>
              <input type="number" [(ngModel)]="cropHeight" (change)="onDimensionsChanged()" min="10" />
            </div>
          </div>

          <div class="aspect-ratio-group">
            <label>Aspect Ratio</label>
            <div class="btn-group">
              <button 
                type="button" 
                class="btn-ratio" 
                [class.active]="aspectRatio === 'free'"
                (click)="setAspectRatio('free')"
              >FreeForm</button>
              <button 
                type="button" 
                class="btn-ratio" 
                [class.active]="aspectRatio === '1:1'"
                (click)="setAspectRatio('1:1')"
              >1:1 Square</button>
              <button 
                type="button" 
                class="btn-ratio" 
                [class.active]="aspectRatio === '16:9'"
                (click)="setAspectRatio('16:9')"
              >16:9</button>
              <button 
                type="button" 
                class="btn-ratio" 
                [class.active]="aspectRatio === '4:3'"
                (click)="setAspectRatio('4:3')"
              >4:3</button>
              <button 
                type="button" 
                class="btn-ratio" 
                [class.active]="aspectRatio === '9:16'"
                (click)="setAspectRatio('9:16')"
              >9:16 Story</button>
            </div>
          </div>

          <div class="input-row">
            <div class="field-group">
              <label>Position (X)</label>
              <input type="number" [(ngModel)]="positionX" min="0" />
            </div>

            <div class="field-group">
              <label>Position (Y)</label>
              <input type="number" [(ngModel)]="positionY" min="0" />
            </div>
          </div>
        </div>

        <!-- Section 2: Rotate & Flip Controls -->
        <div class="control-section">
          <h4>🔄 Rotate & Flip</h4>

          <div class="transform-actions">
            <button type="button" class="btn-action" (click)="rotateClockwise()">
              🔄 Clockwise (90°)
            </button>
            <button type="button" class="btn-action" (click)="rotateCounterClockwise()">
              ↺ Counter Clockwise (-90°)
            </button>
          </div>

          <div class="field-group slider-group">
            <label>Straighten Angle: {{ rotationAngle }}°</label>
            <input 
              type="range" 
              min="-180" 
              max="180" 
              step="1" 
              [(ngModel)]="rotationAngle" 
              (input)="emitSettings()"
            />
          </div>

          <div class="flip-actions">
            <button 
              type="button" 
              class="btn-flip" 
              [class.active]="flipHorizontal" 
              (click)="flipHorizontal = !flipHorizontal; emitSettings()"
            >
              ↔️ Horizontally
            </button>
            <button 
              type="button" 
              class="btn-flip" 
              [class.active]="flipVertical" 
              (click)="flipVertical = !flipVertical; emitSettings()"
            >
              ↕️ Vertically
            </button>
          </div>
        </div>
      </div>

      <!-- Action Footer -->
      <div class="controls-footer">
        <button type="button" class="btn-reset" (click)="resetAll()">Reset</button>
        <button type="button" class="btn-apply-crop" (click)="emitSettings()">Apply Crop & Transform</button>
      </div>
    </div>
  `,
  styles: [`
    .crop-controls-card {
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: 14px;
      padding: 24px;
      margin-bottom: 24px;
    }

    .controls-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 24px;
    }

    .control-section h4 {
      margin: 0 0 16px 0;
      font-size: 1.05rem;
    }

    .input-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      margin-bottom: 16px;
    }

    .field-group {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .field-group label {
      font-size: 0.8rem;
      color: var(--text-secondary);
      font-weight: 500;
    }

    .field-group input[type="number"] {
      background: var(--bg-secondary);
      border: 1px solid var(--border-color);
      border-radius: 8px;
      padding: 8px 12px;
      color: var(--text-primary);
      font-size: 0.9rem;
    }

    .aspect-ratio-group {
      margin-bottom: 16px;
    }

    .aspect-ratio-group label {
      display: block;
      font-size: 0.8rem;
      color: var(--text-secondary);
      margin-bottom: 8px;
      font-weight: 500;
    }

    .btn-group {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }

    .btn-ratio {
      background: var(--bg-secondary);
      color: var(--text-secondary);
      border: 1px solid var(--border-color);
      padding: 6px 12px;
      border-radius: 6px;
      font-size: 0.8rem;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .btn-ratio.active, .btn-ratio:hover {
      background: var(--accent-color, #6366f1);
      color: #ffffff;
      border-color: var(--accent-color, #6366f1);
    }

    .transform-actions {
      display: flex;
      gap: 10px;
      margin-bottom: 16px;
    }

    .btn-action {
      flex: 1;
      background: var(--bg-secondary);
      border: 1px solid var(--border-color);
      color: var(--text-primary);
      padding: 10px;
      border-radius: 8px;
      font-size: 0.8rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .btn-action:hover {
      background: rgba(99, 102, 241, 0.15);
      border-color: #6366f1;
    }

    .slider-group input[type="range"] {
      width: 100%;
      accent-color: #6366f1;
    }

    .flip-actions {
      display: flex;
      gap: 10px;
      margin-top: 16px;
    }

    .btn-flip {
      flex: 1;
      background: var(--bg-secondary);
      border: 1px solid var(--border-color);
      color: var(--text-secondary);
      padding: 10px;
      border-radius: 8px;
      font-size: 0.85rem;
      font-weight: 600;
      cursor: pointer;
    }

    .btn-flip.active {
      background: rgba(99, 102, 241, 0.2);
      color: #818cf8;
      border-color: #6366f1;
    }

    .controls-footer {
      margin-top: 20px;
      padding-top: 16px;
      border-top: 1px solid var(--border-color);
      display: flex;
      justify-content: flex-end;
      gap: 12px;
    }

    .btn-reset {
      background: var(--bg-secondary);
      border: 1px solid var(--border-color);
      color: var(--text-secondary);
      padding: 10px 18px;
      border-radius: 8px;
      font-size: 0.85rem;
      cursor: pointer;
    }

    .btn-apply-crop {
      background: var(--accent-gradient, linear-gradient(135deg, #6366f1, #4f46e5));
      color: #ffffff;
      border: none;
      padding: 10px 20px;
      border-radius: 8px;
      font-weight: 600;
      font-size: 0.85rem;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
    }
  `]
})
export class CropRotateControlsComponent implements OnInit {
  @Output() settingsChanged = new EventEmitter<CropRotateSettings>();

  private _settings: CropRotateSettings = {
    cropWidth: 1080,
    cropHeight: 1080,
    positionX: 0,
    positionY: 0,
    aspectRatio: 'free',
    rotationAngle: 0,
    flipHorizontal: false,
    flipVertical: false,
    format: 'jpeg',
    quality: 85
  };

  @Input() set settings(val: CropRotateSettings | undefined | null) {
    if (val) {
      this._settings = { ...val };
      this.cropWidth = val.cropWidth;
      this.cropHeight = val.cropHeight;
      this.positionX = val.positionX;
      this.positionY = val.positionY;
      this.aspectRatio = val.aspectRatio;
      this.rotationAngle = val.rotationAngle;
      this.flipHorizontal = val.flipHorizontal;
      this.flipVertical = val.flipVertical;
    }
  }

  get settings(): CropRotateSettings {
    return this._settings;
  }

  cropWidth: number = 1080;
  cropHeight: number = 1080;
  positionX: number = 0;
  positionY: number = 0;
  aspectRatio: 'free' | '1:1' | '16:9' | '4:3' | '9:16' = 'free';
  rotationAngle: number = 0;
  flipHorizontal: boolean = false;
  flipVertical: boolean = false;

  ngOnInit(): void {
    this.emitSettings();
  }

  setAspectRatio(ratio: 'free' | '1:1' | '16:9' | '4:3' | '9:16'): void {
    this.aspectRatio = ratio;
    if (ratio === '1:1') {
      this.cropHeight = this.cropWidth;
    } else if (ratio === '16:9') {
      this.cropHeight = Math.round((this.cropWidth * 9) / 16);
    } else if (ratio === '4:3') {
      this.cropHeight = Math.round((this.cropWidth * 3) / 4);
    } else if (ratio === '9:16') {
      this.cropHeight = Math.round((this.cropWidth * 16) / 9);
    }
    this.emitSettings();
  }

  onDimensionsChanged(): void {
    if (this.aspectRatio !== 'free') {
      this.setAspectRatio(this.aspectRatio);
    } else {
      this.emitSettings();
    }
  }

  rotateClockwise(): void {
    this.rotationAngle = (this.rotationAngle + 90) % 360;
    this.emitSettings();
  }

  rotateCounterClockwise(): void {
    this.rotationAngle = (this.rotationAngle - 90) % 360;
    this.emitSettings();
  }

  resetAll(): void {
    this.cropWidth = 1080;
    this.cropHeight = 1080;
    this.positionX = 0;
    this.positionY = 0;
    this.aspectRatio = 'free';
    this.rotationAngle = 0;
    this.flipHorizontal = false;
    this.flipVertical = false;
    this.emitSettings();
  }

  emitSettings(): void {
    this._settings = {
      cropWidth: this.cropWidth,
      cropHeight: this.cropHeight,
      positionX: this.positionX,
      positionY: this.positionY,
      aspectRatio: this.aspectRatio,
      rotationAngle: this.rotationAngle,
      flipHorizontal: this.flipHorizontal,
      flipVertical: this.flipVertical,
      format: this._settings.format,
      quality: this._settings.quality
    };
    this.settingsChanged.emit({ ...this._settings });
  }
}
