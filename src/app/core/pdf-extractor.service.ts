import { Injectable, NgZone } from '@angular/core';
import * as pdfjsLib from 'pdfjs-dist';

export interface PdfExtractProgress {
  currentPage: number;
  totalPages: number;
}

export interface PdfExtractResult {
  renderedPages: { pageNum: number; blob: Blob }[];
  totalPages: number;
  durationMs: number;
}

@Injectable({
  providedIn: 'root'
})
export class PdfExtractorService {
  private pdfjsWorkerReady = false;

  constructor(private ngZone: NgZone) {}

  private initWorker(): void {
    if (this.pdfjsWorkerReady) return;
    pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
    this.pdfjsWorkerReady = true;
  }

  async extractPdfToImages(
    pdfFile: File,
    outputFormat: 'png' | 'jpeg' = 'png',
    scale = 2.0,
    onProgress?: (progress: PdfExtractProgress) => void
  ): Promise<PdfExtractResult> {
    const startTime = performance.now();
    this.initWorker();

    const arrayBuffer = await pdfFile.arrayBuffer();
    const mime = outputFormat === 'jpeg' ? 'image/jpeg' : 'image/png';

    const loadingTask = pdfjsLib.getDocument({
      data: new Uint8Array(arrayBuffer),
      cMapUrl: '/assets/pdfjs/cmaps/',
      cMapPacked: true,
      standardFontDataUrl: '/assets/pdfjs/standard_fonts/'
    });

    const pdfDoc = await loadingTask.promise;
    const totalPages = pdfDoc.numPages;
    const renderedPages: { pageNum: number; blob: Blob }[] = [];

    for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
      if (onProgress) {
        this.ngZone.run(() => onProgress({ currentPage: pageNum, totalPages }));
      }

      const page = await pdfDoc.getPage(pageNum);
      const viewport = page.getViewport({ scale });

      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.floor(viewport.width));
      canvas.height = Math.max(1, Math.floor(viewport.height));

      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        const renderContext = {
          canvasContext: ctx,
          viewport: viewport,
          canvas: canvas
        };

        await page.render(renderContext).promise;

        const blob = await new Promise<Blob | null>(resolve => {
          canvas.toBlob(b => resolve(b), mime, 0.92);
        });

        if (blob) {
          renderedPages.push({ pageNum, blob });
        }
      }

      // Cleanup page resources
      try { (page as any).cleanup(); } catch (e) {}

      // Yield event loop briefly per page
      await new Promise(r => setTimeout(r, 10));
    }

    return {
      renderedPages,
      totalPages,
      durationMs: Math.round(performance.now() - startTime)
    };
  }
}
