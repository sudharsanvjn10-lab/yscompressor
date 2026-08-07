import { Component, Input, ElementRef, ViewChild, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-image-comparison-slider',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (originalUrl && processedUrl) {
      <div class="comparison-card">
        <div class="comparison-header">
          <h3>🔍 Visual Quality Comparison</h3>
          <p>Drag the divider handle left or right to inspect original vs compressed quality side-by-side.</p>
        </div>

        <div #container class="slider-container" (mousedown)="startDragging($event)" (touchstart)="startDragging($event)">
          <!-- Original Image (Bottom Layer) -->
          <img [src]="originalUrl" alt="Original Image" class="image-layer original-layer" />

          <!-- Processed Image (Clipped Top Layer) -->
          <div class="processed-wrapper" [style.clipPath]="'polygon(' + sliderPosition + '% 0, 100% 0, 100% 100%, ' + sliderPosition + '% 100%)'">
            <img [src]="processedUrl" alt="Compressed Result" class="image-layer processed-layer" />
          </div>

          <!-- Divider Line & Drag Handle -->
          <div class="divider-line" [style.left.%]="sliderPosition">
            <div class="handle-circle">
              <span class="handle-icon">↔</span>
            </div>
          </div>

          <!-- Badges Overlay -->
          <div class="badge-overlay original-badge">
            Original: {{ formatSize(originalSize) }}
          </div>
          <div class="badge-overlay processed-badge">
            Compressed: {{ formatSize(processedSize) }} ({{ reductionPercentage }}% savings)
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .comparison-card {
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: 14px;
      padding: 20px;
      margin: 24px 0;
    }

    .comparison-header h3 {
      margin: 0 0 4px 0;
      font-size: 1.1rem;
    }

    .comparison-header p {
      margin: 0 0 16px 0;
      color: var(--text-secondary);
      font-size: 0.85rem;
    }

    .slider-container {
      position: relative;
      width: 100%;
      max-height: 480px;
      height: 400px;
      overflow: hidden;
      border-radius: 10px;
      background: #090d16;
      user-select: none;
      cursor: ew-resize;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .image-layer {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      object-fit: contain;
      pointer-events: none;
    }

    .processed-wrapper {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
    }

    .divider-line {
      position: absolute;
      top: 0;
      bottom: 0;
      width: 3px;
      background: #ffffff;
      box-shadow: 0 0 8px rgba(0, 0, 0, 0.5);
      z-index: 10;
      transform: translateX(-50%);
    }

    .handle-circle {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: var(--accent-gradient, linear-gradient(135deg, #6366f1, #4f46e5));
      border: 2px solid #ffffff;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
      display: flex;
      align-items: center;
      justify-content: center;
      color: #ffffff;
      font-weight: bold;
    }

    .badge-overlay {
      position: absolute;
      top: 14px;
      padding: 6px 14px;
      border-radius: 9999px;
      font-size: 0.8rem;
      font-weight: 600;
      backdrop-filter: blur(8px);
      z-index: 5;
    }

    .original-badge {
      left: 14px;
      background: rgba(15, 23, 42, 0.8);
      color: #ffffff;
      border: 1px solid rgba(255, 255, 255, 0.2);
    }

    .processed-badge {
      right: 14px;
      background: rgba(16, 185, 129, 0.25);
      color: #34d399;
      border: 1px solid rgba(52, 211, 153, 0.4);
    }
  `]
})
export class ImageComparisonSliderComponent {
  @Input() originalUrl: string = '';
  @Input() processedUrl: string = '';
  @Input() originalSize: number = 0;
  @Input() processedSize: number = 0;
  @Input() reductionPercentage: number = 0;

  @ViewChild('container') containerRef!: ElementRef<HTMLDivElement>;

  sliderPosition: number = 50; // percentage
  private isDragging: boolean = false;

  startDragging(event: MouseEvent | TouchEvent): void {
    this.isDragging = true;
    this.updatePosition(event);
  }

  @HostListener('window:mousemove', ['$event'])
  @HostListener('window:touchmove', ['$event'])
  onMove(event: MouseEvent | TouchEvent): void {
    if (!this.isDragging) return;
    this.updatePosition(event);
  }

  @HostListener('window:mouseup')
  @HostListener('window:touchend')
  onEnd(): void {
    this.isDragging = false;
  }

  private updatePosition(event: MouseEvent | TouchEvent): void {
    if (!this.containerRef) return;
    const rect = this.containerRef.nativeElement.getBoundingClientRect();
    const pageX = 'touches' in event ? event.touches[0].pageX : event.pageX;
    const offsetLeft = pageX - rect.left;
    let pos = (offsetLeft / rect.width) * 100;
    pos = Math.max(2, Math.min(98, pos));
    this.sliderPosition = pos;
  }

  formatSize(bytes: number): string {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return (bytes / Math.pow(k, i)).toFixed(2) + ' ' + sizes[i];
  }
}
