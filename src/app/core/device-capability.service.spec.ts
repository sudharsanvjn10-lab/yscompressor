import { TestBed } from '@angular/core/testing';
import { DeviceCapabilityService } from './device-capability.service';

describe('DeviceCapabilityService PDF Risk Evaluation', () => {
  let service: DeviceCapabilityService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [DeviceCapabilityService]
    });
    service = TestBed.inject(DeviceCapabilityService);
  });

  it('should evaluate PDF risk for standard PDF size', () => {
    const risk = service.evaluatePdfRisk(20);
    expect(risk.isHighRisk).toBe(false);
    expect(risk.forcedWindowSize).toBeGreaterThan(0);
  });

  it('should flag high risk and force window size 2 for PDF > 50 pages on low-memory device', () => {
    (service as any).capabilities.isLowMemoryOrMobile = true;
    const risk = service.evaluatePdfRisk(80);
    expect(risk.isHighRisk).toBe(true);
    expect(risk.forcedWindowSize).toBe(2);
    expect(risk.warningMessage).toContain('High PDF page count');
  });
});
