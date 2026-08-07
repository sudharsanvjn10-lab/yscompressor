import { Component, OnDestroy, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavigationEnd, Router } from '@angular/router';
import { Subject, Subscription } from 'rxjs';
import { debounceTime } from 'rxjs/operators';

import { DeviceCapabilityService } from './core/device-capability.service';
import { WorkerPoolService } from './core/worker-pool.service';
import { CodecLoaderService } from './core/codec-loader.service';
import { DonationService } from './core/donation.service';
import { ZipService } from './core/zip.service';
import { ResultUrlManagerService } from './core/result-url-manager.service';
import { ThemeService } from './core/theme.service';
import { SeoService } from './core/seo.service';
import { PdfExtractorService } from './core/pdf-extractor.service';
import { CompressionSettings, ImageJob } from './models/image-job.model';

import { SuiteNavComponent, SuiteMode } from './features/suite-nav/suite-nav.component';
import { UploadZoneComponent } from './features/upload-zone/upload-zone.component';
import { CompressionControlsComponent } from './features/compression-controls/compression-controls.component';
import { ResizeEnhanceControlsComponent, ResizeEnhanceSettings } from './features/resize-enhance-controls/resize-enhance-controls.component';
import { CropRotateControlsComponent, CropRotateSettings } from './features/crop-rotate-controls/crop-rotate-controls.component';
import { ImageComparisonSliderComponent } from './features/image-comparison-slider/image-comparison-slider.component';
import { ImageToPdfComponent, ImageToPdfSettings } from './features/image-to-pdf/image-to-pdf.component';
import { PdfToImageComponent, PdfToImageSettings } from './features/pdf-to-image/pdf-to-image.component';
import { BatchQueueComponent } from './features/batch-queue/batch-queue.component';
import { ResultsActionsComponent } from './features/results-actions/results-actions.component';
import { DonationModalComponent } from './features/donation-modal/donation-modal.component';
import { CookieConsentComponent } from './features/cookie-consent/cookie-consent.component';
import { AdSlotComponent } from './features/ad-slot/ad-slot.component';
import { FeedbackComponent } from './features/feedback/feedback.component';
import { AboutComponent } from './features/about/about.component';

export type ViewTab = 'suite' | 'feedback' | 'about';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    SuiteNavComponent,
    UploadZoneComponent,
    CompressionControlsComponent,
    ResizeEnhanceControlsComponent,
    CropRotateControlsComponent,
    ImageComparisonSliderComponent,
    ImageToPdfComponent,
    PdfToImageComponent,
    BatchQueueComponent,
    ResultsActionsComponent,
    DonationModalComponent,
    CookieConsentComponent,
    AdSlotComponent,
    FeedbackComponent,
    AboutComponent
  ],
  template: `
    <div class="app-shell">
      <!-- Side Rail Left Ad (Displayed on wide screens in viewport margin) -->
      <aside class="side-ad-rail side-rail-left">
        <app-ad-slot format="skyscraper" slotId="ad-home-left-rail" />
      </aside>

      <!-- Side Rail Right Ad (Displayed on wide screens in viewport margin) -->
      <aside class="side-ad-rail side-rail-right">
        <app-ad-slot format="skyscraper" slotId="ad-home-right-rail" />
      </aside>

      <!-- Navbar Header -->
      <header class="app-header">
        <div class="header-container">
          <div class="brand" (click)="navigateToView('suite')" style="cursor: pointer;">
            <span class="logo-icon">⚡</span>
            <div>
              <h1 class="brand-name">YS Compressor</h1>
              <p class="brand-tagline">Client-Side Media Suite (Browser APIs & Worker Threads)</p>
            </div>
          </div>

          <div class="header-actions">
            <!-- Navigation Links -->
            <button type="button" class="btn-nav-link" [class.active]="currentView() === 'suite'" (click)="navigateToView('suite')">
              🛠️ Suite
            </button>
            <button type="button" class="btn-nav-link" [class.active]="currentView() === 'feedback'" (click)="navigateToView('feedback')">
              💬 Feedback
            </button>
            <button type="button" class="btn-nav-link" [class.active]="currentView() === 'about'" (click)="navigateToView('about')">
              🔒 Privacy
            </button>

            <!-- Dual Worker Pool Status Badge -->
            <div class="badge engine-badge" [class.unsupported]="!deviceCap.Capabilities.isSupported">
              💻 Workers: {{ workerPool.metrics().imagePoolSize }} Img / {{ workerPool.metrics().pdfPoolSize }} PDF
            </div>

            <!-- Site Theme Toggle Button -->
            <button 
              type="button" 
              class="btn-theme-toggle"
              (click)="themeService.toggle()"
              [title]="'Switch to ' + (themeService.theme() === 'dark' ? 'Light' : 'Dark') + ' Theme'"
              aria-label="Toggle site theme"
            >
              {{ themeService.theme() === 'dark' ? '☀️' : '🌙' }}
            </button>

            <!-- Support / Donation CTA Button -->
            <button 
              type="button" 
              class="btn-donate" 
              (click)="isDonationModalOpen.set(true)"
            >
              💖 Support YS Compressor
            </button>
          </div>
        </div>
      </header>

      <!-- Dev Stage Notice Banner -->
      <div class="dev-stage-banner">
        <span class="dev-stage-icon">🚧</span>
        <span>
          We are currently in the <strong>development stage</strong>. If you find any bugs, please report them in the
          <a class="feedback-link" (click)="navigateToView('feedback')" role="button" tabindex="0">Feedback</a> section so we can fix them.
          We apologize for any inconvenience!
        </span>
        <span class="dev-stage-icon">🚧</span>
      </div>

      <!-- Main Content Area -->
      <main class="main-content">
        @if (currentView() === 'feedback') {
          <app-feedback />
        } @else if (currentView() === 'about') {
          <app-about />
        } @else {
          <!-- Main Media Processing Suite -->
          <app-suite-nav 
            [activeMode]="activeMode()"
            (modeChanged)="onModeChanged($event)"
          />

          <!-- Unsupported Browser Alert -->
          @if (!deviceCap.Capabilities.isSupported) {
            <div class="alert alert-danger">
              ❌ <strong>Unsupported Browser:</strong> {{ deviceCap.Capabilities.unsupportedReason }}
            </div>
          }

          <!-- Low Memory Alert -->
          @if (deviceCap.Capabilities.isSupported && deviceCap.Capabilities.isLowMemoryOrMobile) {
            <div class="alert alert-warning">
              ℹ️ <strong>Low Memory / Mobile Device Detected:</strong> Batch size capped to 5 files & PDF windowing size set to 2 pages for optimal performance.
            </div>
          }

          <!-- Tab 1: Compress & Convert -->
          @if (activeMode() === 'compress') {
            <app-upload-zone 
              [maxBatchSize]="effectiveMaxBatchSize()"
              [disabled]="!deviceCap.Capabilities.isSupported"
              (filesSelected)="onFilesForCompress($event)"
            />
            <app-compression-controls 
              [settings]="getSelectedCompressSettings()"
              (settingsChanged)="onCompressSettingsChanged($event)"
            />
          }

          <!-- Tab 2: Resize & Enhance -->
          @if (activeMode() === 'resize-enhance') {
            <app-upload-zone 
              [maxBatchSize]="effectiveMaxBatchSize()"
              [disabled]="!deviceCap.Capabilities.isSupported"
              (filesSelected)="onFilesForResizeEnhance($event)"
            />
            <app-resize-enhance-controls 
              [settings]="getSelectedResizeSettings()"
              (settingsChanged)="onResizeSettingsChanged($event)"
            />
          }

          <!-- Tab 3: Crop & Rotate -->
          @if (activeMode() === 'crop-rotate') {
            <app-upload-zone 
              [maxBatchSize]="effectiveMaxBatchSize()"
              [disabled]="!deviceCap.Capabilities.isSupported"
              (filesSelected)="onFilesForCropRotate($event)"
            />
            <app-crop-rotate-controls 
              [settings]="getSelectedCropSettings()"
              (settingsChanged)="onCropSettingsChanged($event)"
            />
          }

          <!-- Tab 4: Image to PDF -->
          @if (activeMode() === 'img-to-pdf') {
            <app-image-to-pdf 
              (startPdfGeneration)="onGeneratePdfFromImages($event)"
            />
          }

          <!-- Tab 5: PDF to Image -->
          @if (activeMode() === 'pdf-to-img') {
            <app-pdf-to-image 
              (startExtraction)="onExtractPdfToImages($event)"
            />
          }

          <!-- Interactive Split-Screen Visual Comparison Slider -->
          @if (activeComparisonJob(); as compJob) {
            <app-image-comparison-slider 
              [originalUrl]="compJob.thumbnailUrl || ''"
              [processedUrl]="compJob.resultUrl || ''"
              [originalSize]="compJob.originalSize"
              [processedSize]="compJob.compressedSize || 0"
              [reductionPercentage]="compJob.reductionPercentage || 0"
            />
          }

          <!-- Virtualized Queue List -->
          <app-batch-queue 
            [jobs]="workerPool.jobs()"
            [selectedJobId]="selectedJob()?.id"
            (downloadSingle)="onDownloadSingle($event)"
            (selectJobForComparison)="selectedJob.set($event)"
          />

          <!-- Results Actions Summary -->
          <app-results-actions 
            [completedCount]="completedJobsCount()"
            [totalCount]="workerPool.jobs().length"
            [totalOriginalBytes]="totalOriginalBytes()"
            [totalCompressedBytes]="totalCompressedBytes()"
            (downloadZip)="onDownloadAllZip()"
            (clearAll)="onClearAllJobs()"
          />
        }
      </main>

      <!-- Footer Ad Slot (Network-agnostic, reserved CLS height) -->
      <footer class="app-footer">
        <app-ad-slot format="leaderboard" slotId="ad-footer-global" />
        <p>YS Compressor — Zero Server Transiting • 100% Free & Open-Source</p>
      </footer>

      <!-- Donation Modal -->
      <app-donation-modal 
        [isOpen]="isDonationModalOpen()"
        (close)="isDonationModalOpen.set(false)"
      />

      <!-- GDPR Cookie Consent Banner -->
      <app-cookie-consent />
    </div>
  `,
  styles: [`
    .app-shell {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      background: var(--bg-primary);
      color: var(--text-primary);
      font-family: 'Inter', system-ui, -apple-system, sans-serif;
      position: relative;
    }

    /* Side Rail Ad Slots (Only visible on wide screens to protect UX) */
    .side-ad-rail {
      display: none;
      position: fixed;
      top: 110px;
      z-index: 50;
    }

    @media (min-width: 1560px) {
      .side-ad-rail {
        display: block;
      }
      .side-rail-left {
        left: 24px;
      }
      .side-rail-right {
        right: 24px;
      }
    }

    .app-header {
      background: var(--bg-header);
      border-bottom: 1px solid var(--border-color);
      backdrop-filter: blur(12px);
      position: sticky;
      top: 0;
      z-index: 100;
      padding: 16px 24px;
    }

    .header-container {
      max-width: 1200px;
      margin: 0 auto;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .brand {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .logo-icon {
      font-size: 2rem;
      background: var(--accent-gradient);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .brand-name {
      margin: 0;
      font-size: 1.4rem;
      font-weight: 700;
      color: var(--text-primary);
    }

    .brand-tagline {
      margin: 0;
      font-size: 0.75rem;
      color: var(--text-secondary);
    }

    .header-actions {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .btn-nav-link {
      background: transparent;
      border: none;
      color: var(--text-secondary);
      font-size: 0.85rem;
      font-weight: 600;
      padding: 6px 12px;
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .btn-nav-link:hover, .btn-nav-link.active {
      color: var(--text-primary);
      background: var(--bg-secondary);
    }

    .badge {
      padding: 6px 12px;
      border-radius: 9999px;
      font-size: 0.8rem;
      font-weight: 600;
    }

    .engine-badge {
      background: rgba(99, 102, 241, 0.15);
      color: #818cf8;
      border: 1px solid rgba(99, 102, 241, 0.3);
    }

    .engine-badge.unsupported {
      background: rgba(239, 68, 68, 0.15);
      color: #f87171;
      border-color: rgba(239, 68, 68, 0.3);
    }

    .btn-theme-toggle {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      border: 1px solid var(--border-color);
      background: var(--bg-card);
      color: var(--text-primary);
      font-size: 1.1rem;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s ease;
    }

    .btn-theme-toggle:hover {
      transform: scale(1.05);
      border-color: var(--accent-color);
    }

    .btn-donate {
      background: linear-gradient(135deg, #ec4899 0%, #db2777 100%);
      color: #ffffff;
      border: none;
      padding: 8px 16px;
      border-radius: 8px;
      font-weight: 600;
      font-size: 0.85rem;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(236, 72, 153, 0.3);
      transition: all 0.2s ease;
    }

    .btn-donate:hover {
      transform: translateY(-1px);
      box-shadow: 0 6px 16px rgba(236, 72, 153, 0.4);
    }

    .main-content {
      flex: 1;
      max-width: 1200px;
      width: 100%;
      margin: 0 auto;
      padding: 32px 24px;
      display: flex;
      flex-direction: column;
    }

    .alert {
      padding: 14px 18px;
      border-radius: 10px;
      margin-bottom: 24px;
      font-size: 0.9rem;
    }

    .alert-danger {
      background: rgba(239, 68, 68, 0.15);
      border: 1px solid rgba(239, 68, 68, 0.3);
      color: #fca5a5;
    }

    .alert-warning {
      background: rgba(245, 158, 11, 0.15);
      border: 1px solid rgba(245, 158, 11, 0.3);
      color: #fde047;
    }

    .app-footer {
      text-align: center;
      padding: 24px;
      border-top: 1px solid var(--border-color-subtle);
      color: var(--text-muted);
      font-size: 0.8rem;
    }

    .dev-stage-banner {
      background: linear-gradient(90deg, rgba(245, 158, 11, 0.12) 0%, rgba(251, 191, 36, 0.08) 100%);
      border-bottom: 1px solid rgba(245, 158, 11, 0.35);
      color: #fbbf24;
      text-align: center;
      padding: 10px 24px;
      font-size: 0.85rem;
      font-weight: 500;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      line-height: 1.5;
    }

    .dev-stage-icon {
      font-size: 1rem;
      flex-shrink: 0;
    }

    .feedback-link {
      color: #fcd34d;
      font-weight: 700;
      text-decoration: underline;
      cursor: pointer;
    }

    .feedback-link:hover {
      color: #fef08a;
    }
  `]
})
export class App implements OnInit, OnDestroy {
  activeMode = signal<SuiteMode>('compress');
  currentView = signal<ViewTab>('suite');
  isDonationModalOpen = signal<boolean>(false);
  selectedJob = signal<ImageJob | null>(null);

  currentCompressSettings: CompressionSettings = {
    format: 'jpeg',
    mode: 'quality',
    jpegQuality: 82,
    webpQuality: 80,
    pngLossless: true,
    targetSizeKb: 500
  };

  currentResizeSettings: ResizeEnhanceSettings = {
    targetWidth: 1920,
    targetHeight: 1080,
    maintainAspectRatio: true,
    sharpen: 0,
    contrast: 0,
    noiseReduction: 0
  };

  currentCropSettings: CropRotateSettings = {
    cropWidth: 1920,
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

  private compressSettingsSubject = new Subject<CompressionSettings>();
  private resizeSettingsSubject = new Subject<ResizeEnhanceSettings>();
  private cropSettingsSubject = new Subject<CropRotateSettings>();
  private readonly subscriptions = new Subscription();

  readonly effectiveMaxBatchSize = computed(() => {
    return this.deviceCap.Capabilities.defaultMaxBatchSize;
  });

  readonly completedJobsCount = computed(() =>
    this.workerPool.jobs().filter(j => j.status === 'done').length
  );

  readonly totalOriginalBytes = computed(() =>
    this.workerPool.jobs()
      .filter(j => j.status === 'done')
      .reduce((sum, j) => sum + j.originalSize, 0)
  );

  readonly totalCompressedBytes = computed(() =>
    this.workerPool.jobs()
      .filter(j => j.status === 'done' && (j as any).compressedSize)
      .reduce((sum, j) => sum + ((j as any).compressedSize || 0), 0)
  );

  readonly activeComparisonJob = computed(() => {
    const list = this.workerPool.jobs();
    const selected = this.selectedJob();
    const target = selected && selected.status === 'done' ? selected : list.filter(j => j.status === 'done').slice(-1)[0];
    
    if (target && (target as any).compressedBlob) {
      if (!(target as any).resultUrl) {
         (target as any).resultUrl = this.urlManager.createUrl(`result_${target.id}`, (target as any).compressedBlob);
      }
      return target;
    }
    return null;
  });

  constructor(
    public deviceCap: DeviceCapabilityService,
    public workerPool: WorkerPoolService,
    private codecLoader: CodecLoaderService,
    public donationService: DonationService,
    private zipService: ZipService,
    private urlManager: ResultUrlManagerService,
    public themeService: ThemeService,
    private seoService: SeoService,
    private pdfExtractor: PdfExtractorService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.seoService.updateSeo({
      title: 'Free Online Image Compressor, Resizer & PDF Converter',
      description: 'YS Compressor compresses, resizes, crops, and converts images and PDFs 100% inside your browser using Web Workers. No uploads, total privacy.',
      canonicalPath: '/'
    });

    this.subscriptions.add(this.compressSettingsSubject.pipe(debounceTime(300)).subscribe(s => this.applyCompressSettings(s)));
    this.subscriptions.add(this.resizeSettingsSubject.pipe(debounceTime(300)).subscribe(s => this.applyResizeSettings(s)));
    this.subscriptions.add(this.cropSettingsSubject.pipe(debounceTime(300)).subscribe(s => this.applyCropSettings(s)));
    this.syncViewFromUrl(this.router.url);
    this.subscriptions.add(this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) this.syncViewFromUrl(event.urlAfterRedirects);
    }));
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
    this.urlManager.revokeAll();
  }

  navigateToView(view: ViewTab): void {
    void this.router.navigateByUrl(view === 'suite' ? '/' : `/${view}`);
  }

  private syncViewFromUrl(url: string): void {
    const path = url.split('?')[0];
    this.currentView.set(path === '/feedback' ? 'feedback' : path === '/about' ? 'about' : 'suite');
  }

  onModeChanged(mode: SuiteMode): void {
    this.activeMode.set(mode);
    const titles: Record<SuiteMode, string> = {
      'compress': 'Batch Image Compressor & Converter',
      'resize-enhance': 'Image Resizer & Enhancer',
      'crop-rotate': 'Image Crop, Rotate & Flip Studio',
      'img-to-pdf': 'Image to PDF Builder',
      'pdf-to-img': 'PDF to Image Extractor'
    };
    this.seoService.updateSeo({
      title: titles[mode],
      description: `YS Compressor ${titles[mode]} - 100% private client-side processing.`
    });
  }

  async onFilesForCompress(files: File[]): Promise<void> {
    const jobs: ImageJob[] = files.map(file => ({
      id: 'job_' + Math.random().toString(36).substring(2, 9),
      type: 'compress',
      file,
      name: file.name,
      originalSize: file.size,
      status: 'queued',
      thumbnailUrl: this.urlManager.createUrl('thumb_' + Math.random(), file),
      format: this.currentCompressSettings.format,
      quality: this.currentCompressSettings.jpegQuality,
      maxFileSizeKb: this.currentCompressSettings.mode === 'targetSize' ? this.currentCompressSettings.targetSizeKb : undefined
    }));

    this.workerPool.addJobs(jobs);
  }

  async onFilesForResizeEnhance(files: File[]): Promise<void> {
    const jobs: ImageJob[] = files.map(file => ({
      id: 'job_' + Math.random().toString(36).substring(2, 9),
      type: this.currentResizeSettings.sharpen > 0 || this.currentResizeSettings.contrast !== 0 || this.currentResizeSettings.noiseReduction > 0 ? 'enhance' : 'resize',
      file,
      name: file.name,
      originalSize: file.size,
      status: 'queued',
      thumbnailUrl: this.urlManager.createUrl('thumb_' + Math.random(), file),
      format: 'jpeg',
      quality: 85,
      targetWidth: this.currentResizeSettings.targetWidth,
      targetHeight: this.currentResizeSettings.targetHeight,
      maintainAspectRatio: this.currentResizeSettings.maintainAspectRatio,
      sharpen: this.currentResizeSettings.sharpen,
      contrast: this.currentResizeSettings.contrast,
      noiseReduction: this.currentResizeSettings.noiseReduction
    }));

    this.workerPool.addJobs(jobs);
  }

  async onFilesForCropRotate(files: File[]): Promise<void> {
    const jobs: ImageJob[] = files.map(file => ({
      id: 'job_crop_' + Math.random().toString(36).substring(2, 9),
      type: 'crop-rotate',
      file,
      name: file.name,
      originalSize: file.size,
      status: 'queued',
      thumbnailUrl: this.urlManager.createUrl('thumb_' + Math.random(), file),
      format: this.currentCropSettings.format,
      quality: this.currentCropSettings.quality,
      cropBox: {
        x: this.currentCropSettings.positionX,
        y: this.currentCropSettings.positionY,
        width: this.currentCropSettings.cropWidth,
        height: this.currentCropSettings.cropHeight
      },
      rotationAngle: this.currentCropSettings.rotationAngle,
      flipHorizontal: this.currentCropSettings.flipHorizontal,
      flipVertical: this.currentCropSettings.flipVertical
    }));

    this.workerPool.addJobs(jobs);
  }

  getSelectedCompressSettings(): CompressionSettings | undefined {
    const job = this.selectedJob();
    if (job && job.type === 'compress') {
      return {
        format: job.format || 'jpeg',
        mode: (job as any).maxFileSizeKb ? 'targetSize' : 'quality',
        jpegQuality: job.format === 'jpeg' ? (job.quality || 82) : 82,
        webpQuality: job.format === 'webp' ? (job.quality || 80) : 80,
        pngLossless: true,
        targetSizeKb: (job as any).maxFileSizeKb || 500
      };
    }
    return this.currentCompressSettings;
  }

  onCompressSettingsChanged(settings: CompressionSettings) {
    this.currentCompressSettings = settings;
    this.compressSettingsSubject.next(settings);
  }

  private applyCompressSettings(settings: CompressionSettings) {
    const targetJob = this.selectedJob();
    if (targetJob && targetJob.type === 'compress') {
      this.urlManager.revoke(`result_${targetJob.id}`);
      this.workerPool.updateAndRequeueJob(targetJob.id, {
        format: settings.format,
        quality: settings.format === 'jpeg' ? settings.jpegQuality : settings.webpQuality,
        maxFileSizeKb: settings.mode === 'targetSize' ? settings.targetSizeKb : undefined
      } as any);
    }
  }

  getSelectedResizeSettings(): ResizeEnhanceSettings | undefined {
    const job = this.selectedJob();
    if (job && (job.type === 'resize' || job.type === 'enhance')) {
      const eJob = job as any;
      return {
        targetWidth: eJob.targetWidth || 1920,
        targetHeight: eJob.targetHeight || 1080,
        maintainAspectRatio: eJob.maintainAspectRatio ?? true,
        sharpen: eJob.sharpen || 0,
        contrast: eJob.contrast || 0,
        noiseReduction: eJob.noiseReduction || 0
      };
    }
    return this.currentResizeSettings;
  }

  onResizeSettingsChanged(settings: ResizeEnhanceSettings) {
    this.currentResizeSettings = settings;
    this.resizeSettingsSubject.next(settings);
  }

  private async applyResizeSettings(settings: ResizeEnhanceSettings) {
    const targetJob = this.selectedJob();
    if (targetJob && (targetJob.type === 'resize' || targetJob.type === 'enhance')) {
      this.urlManager.revoke(`result_${targetJob.id}`);
      this.workerPool.updateAndRequeueJob(targetJob.id, {
        type: settings.sharpen > 0 || settings.contrast !== 0 || settings.noiseReduction > 0 ? 'enhance' : 'resize',
        targetWidth: settings.targetWidth,
        targetHeight: settings.targetHeight,
        maintainAspectRatio: settings.maintainAspectRatio,
        sharpen: settings.sharpen,
        contrast: settings.contrast,
        noiseReduction: settings.noiseReduction
      } as any);
    }
  }

  getSelectedCropSettings(): CropRotateSettings | undefined {
    const job = this.selectedJob();
    if (job && job.type === 'crop-rotate') {
      const cJob = job as any;
      return {
        cropWidth: cJob.cropBox?.width || 1080,
        cropHeight: cJob.cropBox?.height || 1080,
        positionX: cJob.cropBox?.x || 0,
        positionY: cJob.cropBox?.y || 0,
        aspectRatio: 'free',
        rotationAngle: cJob.rotationAngle || 0,
        flipHorizontal: cJob.flipHorizontal || false,
        flipVertical: cJob.flipVertical || false,
        format: cJob.format || 'jpeg',
        quality: cJob.quality || 85
      };
    }
    return this.currentCropSettings;
  }

  onCropSettingsChanged(settings: CropRotateSettings) {
    this.currentCropSettings = settings;
    this.cropSettingsSubject.next(settings);
  }

  private applyCropSettings(settings: CropRotateSettings) {
    const targetJob = this.selectedJob();
    if (targetJob && targetJob.type === 'crop-rotate') {
      this.urlManager.revoke(`result_${targetJob.id}`);
      this.workerPool.updateAndRequeueJob(targetJob.id, {
        format: settings.format,
        quality: settings.quality,
        cropBox: {
          x: settings.positionX,
          y: settings.positionY,
          width: settings.cropWidth,
          height: settings.cropHeight
        },
        rotationAngle: settings.rotationAngle,
        flipHorizontal: settings.flipHorizontal,
        flipVertical: settings.flipVertical
      } as any);
    }
  }

  async onGeneratePdfFromImages(settings: ImageToPdfSettings): Promise<void> {
    await this.codecLoader.ensureChunkLoaded('pdf-lib');

    const job: ImageJob = {
      id: 'job_pdf_' + Math.random().toString(36).substring(2, 9),
      type: 'img-to-pdf',
      files: settings.files,
      name: `YSCompressor_Document_${Date.now()}.pdf`,
      originalSize: settings.files.reduce((sum, f) => sum + f.size, 0),
      status: 'queued',
      pageSize: settings.pageSize
    };

    this.workerPool.addJob(job);
  }

  async onExtractPdfToImages(settings: PdfToImageSettings): Promise<void> {
    await this.codecLoader.ensureChunkLoaded('pdfjs');

    const jobId = 'job_extract_' + Math.random().toString(36).substring(2, 9);
    const job: ImageJob = {
      id: jobId,
      type: 'pdf-to-img',
      pdfFile: settings.pdfFile,
      name: settings.pdfFile.name,
      originalSize: settings.pdfFile.size,
      status: 'processing',
      outputFormat: settings.outputFormat,
      scale: settings.scale
    };

    this.workerPool.jobs.update(list => [...list, job]);

    try {
      const result = await this.pdfExtractor.extractPdfToImages(
        settings.pdfFile,
        settings.outputFormat,
        settings.scale,
        (progress) => {
          this.workerPool.jobs.update(list => list.map(j => j.id === jobId ? {
            ...j,
            currentRenderingPage: progress.currentPage,
            totalPages: progress.totalPages
          } as any : j));
        }
      );

      this.workerPool.jobs.update(list => list.map(j => j.id === jobId ? {
        ...j,
        status: 'done',
        renderedPages: result.renderedPages,
        durationMs: result.durationMs
      } as any : j));
    } catch (err: any) {
      console.error('PDF extraction error:', err);
      this.workerPool.jobs.update(list => list.map(j => j.id === jobId ? {
        ...j,
        status: 'error',
        errorMessage: err.message || 'PDF extraction failed'
      } as any : j));
    }
  }

  onDownloadSingle(job: ImageJob): void {
    if (job.status !== 'done') return;

    const baseName = job.name.replace(/\.[^/.]+$/, '');

    if (job.type === 'img-to-pdf' && job.outputPdfBlob) {
      this.zipService.triggerDownload(job.outputPdfBlob, `${baseName}.pdf`);
    } else if (job.type === 'pdf-to-img' && job.renderedPages && job.renderedPages.length > 0) {
      const fmt = job.outputFormat || 'png';
      if (job.renderedPages.length === 1) {
        this.zipService.triggerDownload(job.renderedPages[0].blob, `${baseName}_page_1.${fmt}`);
      } else {
        this.zipService.downloadZip([job], `${baseName}_extracted_pages.zip`);
      }
    } else if ((job as any).compressedBlob) {
      const ext = (job as any).format === 'jpeg' ? '.jpg' : `.${(job as any).format || 'jpg'}`;
      const filename = `${baseName}_processed${ext}`;
      this.zipService.triggerDownload((job as any).compressedBlob, filename);
    }
  }

  async onDownloadAllZip(): Promise<void> {
    await this.codecLoader.ensureChunkLoaded('jszip');
    const completed = this.workerPool.jobs().filter(j => j.status === 'done');
    this.zipService.downloadZip(completed as any);
  }

  onClearAllJobs(): void {
    this.selectedJob.set(null);
    this.urlManager.revokeAll();
    this.workerPool.clearAllJobs();
  }
}
