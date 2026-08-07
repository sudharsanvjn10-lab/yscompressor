/// <reference lib="webworker" />
import { PDFDocument, PageSizes } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';
import 'pdfjs-dist/build/pdf.worker.mjs';


export interface PdfJobMessage {
  id: string;
  type: 'img-to-pdf' | 'pdf-to-img';
  // Img to PDF params
  images?: File[];
  pageSize?: 'a4' | 'letter' | 'auto';
  // PDF to Img params
  pdfFile?: File;
  outputFormat?: 'png' | 'jpeg';
  scale?: number;
  windowSize?: number;
}

export interface PdfWorkerResponse {
  id: string;
  status: 'done' | 'error' | 'progress';
  outputPdfBlob?: Blob;
  renderedPages?: { pageNum: number; blob: Blob }[];
  currentPage?: number;
  totalPages?: number;
  durationMs?: number;
  errorMessage?: string;
}

/**
 * Custom Canvas Factory for PDF.js inside Web Worker environment.
 * Prevents DOMCanvasFactory document.createElement() errors.
 */
class WorkerCanvasFactory {
  create(width: number, height: number) {
    const w = Math.max(1, Math.floor(width));
    const h = Math.max(1, Math.floor(height));
    const canvas = new OffscreenCanvas(w, h);
    const context = canvas.getContext('2d');
    return { canvas, context };
  }

  reset(canvasAndContext: any, width: number, height: number) {
    if (canvasAndContext && canvasAndContext.canvas) {
      canvasAndContext.canvas.width = Math.max(1, Math.floor(width));
      canvasAndContext.canvas.height = Math.max(1, Math.floor(height));
    }
  }

  destroy(canvasAndContext: any) {
    if (canvasAndContext && canvasAndContext.canvas) {
      canvasAndContext.canvas.width = 1;
      canvasAndContext.canvas.height = 1;
      canvasAndContext.canvas = null;
      canvasAndContext.context = null;
    }
  }
}

/**
 * Helper to ensure image file (including WebP, BMP, AVIF) is safely converted to PNG/JPG bytes for pdf-lib embedding.
 */
async function ensurePngOrJpgBytes(file: File): Promise<{ bytes: Uint8Array; isPng: boolean }> {
  const fileType = (file.type || '').toLowerCase();
  const fileName = (file.name || '').toLowerCase();

  const isPng = fileType.includes('png') || fileName.endsWith('.png');
  const isJpg = fileType.includes('jpeg') || fileType.includes('jpg') || fileName.endsWith('.jpg') || fileName.endsWith('.jpeg');

  if (isPng || isJpg) {
    try {
      const arrayBuffer = await file.arrayBuffer();
      return { bytes: new Uint8Array(arrayBuffer), isPng };
    } catch (e) {
      // Fall through to canvas decode on error
    }
  }

  // Convert WebP / BMP / AVIF / HEIC to JPEG via OffscreenCanvas to save PDF space (photographic content)
  const bitmap = await createImageBitmap(file);
  const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
  const ctx = canvas.getContext('2d');
  if (ctx) {
    // Fill white background in case the source had transparency, since JPEG doesn't support it
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(bitmap, 0, 0);
  }
  bitmap.close();

  const jpegBlob = await canvas.convertToBlob({ type: 'image/jpeg', quality: 0.92 });
  const jpegBuffer = await jpegBlob.arrayBuffer();
  return { bytes: new Uint8Array(jpegBuffer), isPng: false };
}

addEventListener('message', async ({ data }: { data: PdfJobMessage }) => {
  const startTime = performance.now();
  const { id, type } = data;

  try {
    if (type === 'img-to-pdf') {
      if (!data.images || data.images.length === 0) {
        throw new Error('No images provided for PDF assembly');
      }

      const pdfDoc = await PDFDocument.create();

      for (const imageFile of data.images) {
        const { bytes, isPng } = await ensurePngOrJpgBytes(imageFile);
        let embeddedImage;

        if (isPng) {
          embeddedImage = await pdfDoc.embedPng(bytes);
        } else {
          try {
            embeddedImage = await pdfDoc.embedJpg(bytes);
          } catch (e) {
            // Fallback: convert to PNG if JPG embedding throws SOI error
            const bitmap = await createImageBitmap(new Blob([bytes.buffer as ArrayBuffer]));
            const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
            const ctx = canvas.getContext('2d');
            if (ctx) ctx.drawImage(bitmap, 0, 0);
            bitmap.close();
            const pngBlob = await canvas.convertToBlob({ type: 'image/png' });
            const pngBuffer = await pngBlob.arrayBuffer();
            embeddedImage = await pdfDoc.embedPng(new Uint8Array(pngBuffer));
          }
        }

        const imgWidth = embeddedImage.width;
        const imgHeight = embeddedImage.height;

        let pageWidth = imgWidth;
        let pageHeight = imgHeight;

        if (data.pageSize === 'a4') {
          [pageWidth, pageHeight] = PageSizes.A4;
        } else if (data.pageSize === 'letter') {
          [pageWidth, pageHeight] = PageSizes.Letter;
        }

        const page = pdfDoc.addPage([pageWidth, pageHeight]);

        // Fit image within target page bounds while preserving aspect ratio
        const scale = Math.min(pageWidth / imgWidth, pageHeight / imgHeight);
        const drawW = imgWidth * scale;
        const drawH = imgHeight * scale;
        const x = (pageWidth - drawW) / 2;
        const y = (pageHeight - drawH) / 2;

        page.drawImage(embeddedImage, {
          x,
          y,
          width: drawW,
          height: drawH
        });
      }

      const pdfBytes = await pdfDoc.save();
      const outputPdfBlob = new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' });

      postMessage({
        id,
        status: 'done',
        outputPdfBlob,
        durationMs: Math.round(performance.now() - startTime)
      } as PdfWorkerResponse);

    } else if (type === 'pdf-to-img') {
      if (!data.pdfFile) {
        throw new Error('No PDF file provided for rendering');
      }

      const arrayBuf = await data.pdfFile.arrayBuffer();
      const format = data.outputFormat || 'png';
      const mime = format === 'jpeg' ? 'image/jpeg' : 'image/png';
      const scale = data.scale || 2.0;
      const canvasFactory = new WorkerCanvasFactory();

      // Load PDF document via PDF.js in synchronous (fake-worker) mode.
      // CRITICAL: Pass WorkerCanvasFactory so PDF.js never calls DOMCanvasFactory
      // (which tries document.createElement inside a Worker — causing failures).
      const pdfTask = pdfjsLib.getDocument({
        data: new Uint8Array(arrayBuf),
        CanvasFactory: canvasFactory as any,
        cMapUrl: '/assets/pdfjs/cmaps/',
        cMapPacked: true,
        standardFontDataUrl: '/assets/pdfjs/standard_fonts/',
        useWorkerFetch: false
      });

      const pdfDoc = await pdfTask.promise;
      const totalPages = pdfDoc.numPages;

      // Dynamic windowing: heavily paginated documents yield the event loop more frequently
      // to give the browser's GC time to clean up OffscreenCanvas detachments.
      let windowSize = data.windowSize || 3;
      if (totalPages > 100) {
        windowSize = 1;
      } else if (totalPages > 25) {
        windowSize = 2;
      }
      const renderedPages: { pageNum: number; blob: Blob }[] = [];

      for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
        // Report progress back
        postMessage({
          id,
          status: 'progress',
          currentPage: pageNum,
          totalPages
        } as PdfWorkerResponse);

        const page = await pdfDoc.getPage(pageNum);
        const viewport = page.getViewport({ scale });

        if (typeof OffscreenCanvas !== 'undefined') {
          const canvas = new OffscreenCanvas(Math.max(1, Math.floor(viewport.width)), Math.max(1, Math.floor(viewport.height)));
          const ctx = canvas.getContext('2d');

          if (ctx) {
            // Fill solid white background for high quality output
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            const renderContext = {
              canvasContext: ctx as any,
              viewport: viewport,
              canvasFactory: canvasFactory as any
            };

            await page.render(renderContext as any).promise;
            const blob = await canvas.convertToBlob({ type: mime, quality: 0.92 });
            renderedPages.push({ pageNum, blob });
          }
        }

        // Clean up page resources
        try { (page as any).cleanup(); } catch (e) {}

        // Bounded window delay to allow memory release per window
        if (pageNum % windowSize === 0) {
          await new Promise(r => setTimeout(r, 20));
        }
      }

      postMessage({
        id,
        status: 'done',
        renderedPages,
        totalPages,
        durationMs: Math.round(performance.now() - startTime)
      } as PdfWorkerResponse);
    }
  } catch (err: any) {
    console.error(`PDF worker error for job ${id}:`, err);
    postMessage({
      id,
      status: 'error',
      errorMessage: err.message || 'PDF processing failed inside worker',
      durationMs: Math.round(performance.now() - startTime)
    } as PdfWorkerResponse);
  }
});
