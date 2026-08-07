import { Injectable, NgZone, signal, OnDestroy, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { ImageJob } from '../models/image-job.model';
import { JOB_SUBPOOL_MAP, SubPoolTarget } from '../models/worker-job-router.model';
import { DeviceCapabilityService } from './device-capability.service';

interface WorkerSlot {
  id: number;
  poolType: SubPoolTarget;
  worker: Worker;
  busy: boolean;
  currentJobId: string | null;
  timeoutTimer: any | null;
}

export interface DualPoolMetrics {
  totalBudget: number;
  imagePoolSize: number;
  pdfPoolSize: number;
  activeWorkers: number;
  queuedJobs: number;
  completedJobs: number;
  failedJobs: number;
}

@Injectable({
  providedIn: 'root'
})
export class WorkerPoolService implements OnDestroy {
  private imageWorkers: WorkerSlot[] = [];
  private pdfWorkers: WorkerSlot[] = [];
  
  private imageQueue: ImageJob[] = [];
  private pdfQueue: ImageJob[] = [];

  readonly jobs = signal<ImageJob[]>([]);
  readonly metrics = signal<DualPoolMetrics>({
    totalBudget: 0,
    imagePoolSize: 0,
    pdfPoolSize: 0,
    activeWorkers: 0,
    queuedJobs: 0,
    completedJobs: 0,
    failedJobs: 0
  });

  private readonly JOB_TIMEOUT_MS = 30000;

  constructor(
    private ngZone: NgZone,
    private deviceCap: DeviceCapabilityService,
    @Inject(PLATFORM_ID) private platformId: object
  ) {
    // Workers can only be spawned in a browser context
    if (isPlatformBrowser(this.platformId)) {
      this.initSubPools();
    }
  }

  private initSubPools(): void {
    const maxConcurrency = this.deviceCap.Capabilities.hardwareConcurrency;
    const totalBudget = Math.max(2, Math.min(maxConcurrency || 4, 6));

    // Split budget proportionally: 2/3 for image pool, 1/3 for pdf pool
    const pdfSize = Math.max(1, Math.floor(totalBudget / 3));
    const imageSize = totalBudget - pdfSize;

    for (let i = 0; i < imageSize; i++) {
      this.imageWorkers.push(this.createWorkerSlot(i, 'image'));
    }

    for (let j = 0; j < pdfSize; j++) {
      this.pdfWorkers.push(this.createWorkerSlot(j, 'pdf'));
    }

    this.updateMetrics();
  }

  private createWorkerSlot(slotId: number, poolType: SubPoolTarget): WorkerSlot {
    let worker: Worker;
    if (poolType === 'pdf') {
      worker = new Worker(new URL('../workers/pdf.worker', import.meta.url), { type: 'module' });
    } else {
      worker = new Worker(new URL('../workers/compress.worker', import.meta.url), { type: 'module' });
    }

    const slot: WorkerSlot = {
      id: slotId,
      poolType,
      worker,
      busy: false,
      currentJobId: null,
      timeoutTimer: null
    };

    this.ngZone.runOutsideAngular(() => {
      worker.onmessage = (event: MessageEvent<any>) => {
        this.handleWorkerMessage(slot, event.data);
      };

      worker.onerror = (error: ErrorEvent) => {
        console.error(`Worker [${poolType}] slot ${slotId} error:`, error);
        this.handleWorkerError(slot, error.message || 'Worker thread error');
      };
    });

    return slot;
  }

  addJob(job: ImageJob): void {
    const poolTarget = JOB_SUBPOOL_MAP[job.type] || 'image';
    this.jobs.update(list => [...list, job]);

    if (poolTarget === 'pdf') {
      this.pdfQueue.push(job);
    } else {
      this.imageQueue.push(job);
    }

    this.updateMetrics();
    this.processQueue(poolTarget);
  }

  addJobs(newJobs: ImageJob[]): void {
    for (const j of newJobs) {
      this.addJob(j);
    }
  }

  updateAndRequeueJob(jobId: string, patch: Partial<ImageJob>): void {
    // 1. Cancel if it's currently running
    const activeSlot = [...this.imageWorkers, ...this.pdfWorkers].find(w => w.currentJobId === jobId);
    if (activeSlot) {
      this.respawnSlot(activeSlot);
    }

    // 2. Remove from queues if it's pending
    this.imageQueue = this.imageQueue.filter(j => j.id !== jobId);
    this.pdfQueue = this.pdfQueue.filter(j => j.id !== jobId);

    // 3. Update job data and set status back to 'queued'
    this.jobs.update(list => list.map(j => j.id === jobId ? { ...j, ...patch, status: 'queued', compressedBlob: undefined, resultUrl: undefined, errorMessage: undefined } as ImageJob : j));
    
    // 4. Re-add to appropriate queue
    const updatedJob = this.jobs().find(j => j.id === jobId);
    if (updatedJob) {
      const target = updatedJob.type === 'img-to-pdf' || updatedJob.type === 'pdf-to-img' ? 'pdf' : 'image';
      if (target === 'pdf') {
        this.pdfQueue.push(updatedJob);
      } else {
        this.imageQueue.push(updatedJob);
      }
      this.processQueue(target);
    }
    this.updateMetrics();
  }

  private processQueue(target: SubPoolTarget): void {
    const queue = target === 'pdf' ? this.pdfQueue : this.imageQueue;
    const workers = target === 'pdf' ? this.pdfWorkers : this.imageWorkers;

    if (queue.length === 0) return;

    const availableSlot = workers.find(w => !w.busy);
    if (!availableSlot) return;

    const nextJob = queue.shift();
    if (!nextJob) return;

    this.assignJob(availableSlot, nextJob);
    this.processQueue(target);
  }

  private assignJob(slot: WorkerSlot, job: ImageJob): void {
    slot.busy = true;
    slot.currentJobId = job.id;

    this.updateJobStatus(job.id, { status: 'processing' });

    slot.timeoutTimer = setTimeout(() => {
      console.warn(`Job ${job.id} timed out after 30s. Respawning [${slot.poolType}] worker slot ${slot.id}...`);
      this.handleTimeout(slot, job.id);
    }, this.JOB_TIMEOUT_MS);

    // Format postMessage payload according to job type
    let payload: any = { id: job.id, type: job.type };

    if (job.type === 'compress') {
      payload = { ...payload, file: job.file, format: job.format, quality: job.quality };
    } else if (job.type === 'resize') {
      payload = { ...payload, file: job.file, format: job.format, quality: job.quality, targetWidth: job.targetWidth, targetHeight: job.targetHeight, maintainAspectRatio: job.maintainAspectRatio };
    } else if (job.type === 'enhance') {
      payload = { ...payload, file: job.file, format: job.format, quality: job.quality, sharpen: job.sharpen, contrast: job.contrast, noiseReduction: job.noiseReduction };
    } else if (job.type === 'crop-rotate') {
      payload = { ...payload, file: job.file, format: job.format, quality: job.quality, cropBox: job.cropBox, rotationAngle: job.rotationAngle, flipHorizontal: job.flipHorizontal, flipVertical: job.flipVertical };
    } else if (job.type === 'img-to-pdf') {
      payload = { ...payload, images: job.files, pageSize: job.pageSize };
    } else if (job.type === 'pdf-to-img') {
      payload = { ...payload, pdfFile: job.pdfFile, outputFormat: job.outputFormat, scale: job.scale, windowSize: this.deviceCap.Capabilities.pdfWindowSize };
    }

    slot.worker.postMessage(payload);
    this.updateMetrics();
  }

  private handleWorkerMessage(slot: WorkerSlot, data: any): void {
    if (data.status === 'progress') {
      this.ngZone.run(() => {
        this.updateJobStatus(data.id, {
          currentRenderingPage: data.currentPage,
          totalPages: data.totalPages
        } as any);
      });
      return;
    }

    this.clearSlotTimeout(slot);

    this.ngZone.run(() => {
      if (data.status === 'done') {
        if (data.outputPdfBlob) {
          this.updateJobStatus(data.id, { status: 'done', outputPdfBlob: data.outputPdfBlob, durationMs: data.durationMs } as any);
        } else if (data.renderedPages) {
          this.updateJobStatus(data.id, { status: 'done', renderedPages: data.renderedPages, durationMs: data.durationMs } as any);
        } else {
          this.updateJobStatus(data.id, {
            status: 'done',
            compressedBlob: data.compressedBlob,
            compressedSize: data.compressedSize,
            reductionPercentage: data.reductionPercentage,
            targetSizeExceeded: data.targetSizeExceeded,
            durationMs: data.durationMs
          } as any);
        }
      } else {
        this.updateJobStatus(data.id, {
          status: 'error',
          errorMessage: data.errorMessage || 'Processing error'
        });
      }

      this.freeSlot(slot);
      this.processQueue(slot.poolType);
    });
  }

  private handleTimeout(slot: WorkerSlot, jobId: string): void {
    this.ngZone.run(() => {
      this.updateJobStatus(jobId, { status: 'error', errorMessage: 'Job timed out after 30 seconds' });
      this.respawnSlot(slot);
      this.processQueue(slot.poolType);
    });
  }

  private handleWorkerError(slot: WorkerSlot, errorMsg: string): void {
    this.clearSlotTimeout(slot);
    this.ngZone.run(() => {
      if (slot.currentJobId) {
        this.updateJobStatus(slot.currentJobId, { status: 'error', errorMessage: errorMsg });
      }
      this.respawnSlot(slot);
      this.processQueue(slot.poolType);
    });
  }

  private respawnSlot(slot: WorkerSlot): void {
    try { slot.worker.terminate(); } catch (e) {}

    let newWorker: Worker;
    if (slot.poolType === 'pdf') {
      newWorker = new Worker(new URL('../workers/pdf.worker', import.meta.url), { type: 'module' });
    } else {
      newWorker = new Worker(new URL('../workers/compress.worker', import.meta.url), { type: 'module' });
    }

    slot.worker = newWorker;
    slot.busy = false;
    slot.currentJobId = null;
    slot.timeoutTimer = null;

    this.ngZone.runOutsideAngular(() => {
      newWorker.onmessage = (event: MessageEvent<any>) => {
        this.handleWorkerMessage(slot, event.data);
      };
      newWorker.onerror = (error: ErrorEvent) => {
        console.error(`Worker [${slot.poolType}] slot ${slot.id} error:`, error);
        this.handleWorkerError(slot, error.message || 'Worker thread error');
      };
    });

    this.updateMetrics();
  }

  private freeSlot(slot: WorkerSlot): void {
    this.clearSlotTimeout(slot);
    slot.busy = false;
    slot.currentJobId = null;
    this.updateMetrics();
  }

  private clearSlotTimeout(slot: WorkerSlot): void {
    if (slot.timeoutTimer) {
      clearTimeout(slot.timeoutTimer);
      slot.timeoutTimer = null;
    }
  }

  private updateJobStatus(jobId: string, patch: Partial<ImageJob>): void {
    this.jobs.update(list =>
      list.map(j => (j.id === jobId ? { ...j, ...patch } as ImageJob : j))
    );
    this.updateMetrics();
  }

  clearAllJobs(): void {
    this.imageQueue = [];
    this.pdfQueue = [];
    for (const slot of [...this.imageWorkers, ...this.pdfWorkers]) {
      if (slot.busy) {
        this.clearSlotTimeout(slot);
        this.respawnSlot(slot);
      }
    }
    this.jobs.set([]);
    this.updateMetrics();
  }

  private updateMetrics(): void {
    const list = this.jobs();
    const activeWorkers = [...this.imageWorkers, ...this.pdfWorkers].filter(w => w.busy).length;

    this.metrics.set({
      totalBudget: this.imageWorkers.length + this.pdfWorkers.length,
      imagePoolSize: this.imageWorkers.length,
      pdfPoolSize: this.pdfWorkers.length,
      activeWorkers,
      queuedJobs: list.filter(j => j.status === 'queued').length,
      completedJobs: list.filter(j => j.status === 'done').length,
      failedJobs: list.filter(j => j.status === 'error').length
    });
  }

  ngOnDestroy(): void {
    for (const w of [...this.imageWorkers, ...this.pdfWorkers]) {
      this.clearSlotTimeout(w);
      w.worker.terminate();
    }
  }
}
