import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export interface DeviceCapabilities {
  hasOffscreenCanvas: boolean;
  hasWebAssembly: boolean;
  hardwareConcurrency: number;
  deviceMemoryGbr: number | null;
  isLowMemoryOrMobile: boolean;
  defaultMaxBatchSize: number;
  pdfWindowSize: number; // 2 for low-memory, 4 for standard
  isSupported: boolean;
  unsupportedReason?: string;
}

export interface PdfRiskEvaluation {
  isHighRisk: boolean;
  forcedWindowSize: number;
  warningMessage?: string;
}

@Injectable({
  providedIn: 'root'
})
export class DeviceCapabilityService {
  private readonly capabilities: DeviceCapabilities;

  constructor(@Inject(PLATFORM_ID) private platformId: object) {
    this.capabilities = this.detectCapabilities();
  }

  get Capabilities(): DeviceCapabilities {
    return this.capabilities;
  }

  evaluatePdfRisk(pageCount: number): PdfRiskEvaluation {
    const isLowMemory = this.capabilities.isLowMemoryOrMobile;
    const isLargePdf = pageCount > 50;

    if (isLargePdf && isLowMemory) {
      return {
        isHighRisk: true,
        forcedWindowSize: 2,
        warningMessage: `High PDF page count (${pageCount} pages) on a low-memory device. Windowed pagination (2 pages/batch) will be strictly enforced to prevent browser tab crashing.`
      };
    } else if (isLargePdf) {
      return {
        isHighRisk: false,
        forcedWindowSize: 3,
        warningMessage: `Large PDF (${pageCount} pages) detected. Rendering will proceed in windowed batches of 3 pages.`
      };
    }

    return {
      isHighRisk: false,
      forcedWindowSize: this.capabilities.pdfWindowSize
    };
  }

  private detectCapabilities(): DeviceCapabilities {
    // SSR safe: all browser APIs guarded
    if (!isPlatformBrowser(this.platformId)) {
      return {
        hasOffscreenCanvas: false,
        hasWebAssembly: false,
        hardwareConcurrency: 4,
        deviceMemoryGbr: null,
        isLowMemoryOrMobile: false,
        defaultMaxBatchSize: 20,
        pdfWindowSize: 4,
        isSupported: false,
        unsupportedReason: 'Server-side rendering context'
      };
    }

    const hasOffscreenCanvas = typeof OffscreenCanvas !== 'undefined';
    const hasWebAssembly =
      typeof WebAssembly !== 'undefined' && typeof WebAssembly.instantiate === 'function';

    const nav = typeof navigator !== 'undefined' ? navigator : ({} as any);
    const hardwareConcurrency = nav.hardwareConcurrency || 4;
    const deviceMemoryGbr = (nav as any).deviceMemory || null;

    const isMobileUA =
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        nav.userAgent || ''
      );
    const isLowMemory =
      (deviceMemoryGbr !== null && deviceMemoryGbr <= 4) ||
      hardwareConcurrency <= 2 ||
      isMobileUA;

    const isSupported = hasOffscreenCanvas;
    let unsupportedReason: string | undefined;

    if (!hasOffscreenCanvas) {
      unsupportedReason =
        'Your browser lacks OffscreenCanvas support. High-performance off-thread canvas rendering is unavailable.';
    }

    const defaultMaxBatchSize = isLowMemory ? 5 : 20;
    const pdfWindowSize = isLowMemory ? 2 : 4;

    return {
      hasOffscreenCanvas,
      hasWebAssembly,
      hardwareConcurrency,
      deviceMemoryGbr,
      isLowMemoryOrMobile: isLowMemory,
      defaultMaxBatchSize,
      pdfWindowSize,
      isSupported,
      unsupportedReason
    };
  }
}
