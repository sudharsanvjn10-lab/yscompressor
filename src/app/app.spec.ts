import { TestBed } from '@angular/core/testing';
import { App } from './app';
import { DeviceCapabilityService } from './core/device-capability.service';

describe('App Component', () => {
  beforeEach(async () => {
    // Stub OffscreenCanvas and Worker for JSDOM test runner globally
    if (typeof (globalThis as any).OffscreenCanvas === 'undefined') {
      (globalThis as any).OffscreenCanvas = class {
        constructor() {}
        getContext() { return {}; }
        convertToBlob() { return Promise.resolve(new Blob()); }
      };
    }
    if (typeof (globalThis as any).Worker === 'undefined') {
      (globalThis as any).Worker = class {
        onmessage: any;
        onerror: any;
        postMessage() {}
        terminate() {}
      };
    }

    const deviceCapMock = {
      Capabilities: {
        hasOffscreenCanvas: true,
        hasWebAssembly: true,
        hardwareConcurrency: 4,
        deviceMemoryGbr: 8,
        isLowMemoryOrMobile: false,
        defaultMaxBatchSize: 20,
        isSupported: true
      }
    };

    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        { provide: DeviceCapabilityService, useValue: deviceCapMock }
      ]
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should render brand title', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h1')?.textContent).toContain('Yazhsiv Conversion');
  });
});
