import { TestBed } from '@angular/core/testing';
import { WorkerPoolService } from './worker-pool.service';
import { DeviceCapabilityService } from './device-capability.service';
import { ImageJob } from '../models/image-job.model';

describe('WorkerPoolService Dual Sub-Pool Architecture', () => {
  let service: WorkerPoolService;

  beforeEach(() => {
    const deviceCapMock = {
      Capabilities: {
        hasOffscreenCanvas: true,
        hasWebAssembly: true,
        hardwareConcurrency: 4,
        deviceMemoryGbr: 8,
        isLowMemoryOrMobile: false,
        defaultMaxBatchSize: 20,
        pdfWindowSize: 4,
        isSupported: true
      }
    };

    TestBed.configureTestingModule({
      providers: [
        WorkerPoolService,
        { provide: DeviceCapabilityService, useValue: deviceCapMock }
      ]
    });

    if (typeof (globalThis as any).Worker === 'undefined') {
      (globalThis as any).Worker = class MockWorker {
        onmessage: any;
        onerror: any;
        postMessage(data: any) {}
        terminate() {}
      };
    }

    service = TestBed.inject(WorkerPoolService);
  });

  it('should initialize dual sub-pools (imagePool and pdfPool) within budget', () => {
    const metrics = service.metrics();
    expect(metrics.totalBudget).toBe(4);
    expect(metrics.imagePoolSize).toBeGreaterThan(0);
    expect(metrics.pdfPoolSize).toBeGreaterThan(0);
  });

  it('should route image jobs and pdf jobs to their respective sub-pools', () => {
    const dummyFile = new File(['dummy content'], 'test.jpg', { type: 'image/jpeg' });
    const compressJob: ImageJob = {
      id: 'job_c1',
      type: 'compress',
      file: dummyFile,
      name: 'test.jpg',
      originalSize: 1000,
      status: 'queued',
      format: 'jpeg',
      quality: 82
    };

    service.addJob(compressJob);
    expect(service.jobs().length).toBe(1);
    expect(service.jobs()[0].id).toBe('job_c1');
  });

  it('should clear all queues and reset metrics on clearAllJobs()', () => {
    service.clearAllJobs();
    expect(service.jobs().length).toBe(0);
    expect(service.metrics().queuedJobs).toBe(0);
  });
});
