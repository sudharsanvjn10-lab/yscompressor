import { Injectable, signal } from '@angular/core';

export type LazyChunkType = 'mozjpeg' | 'oxipng' | 'webp' | 'magick' | 'pdf-lib' | 'pdfjs' | 'jszip';

@Injectable({
  providedIn: 'root'
})
export class CodecLoaderService {
  private loadedChunks = new Set<LazyChunkType>();
  private loadingPromises = new Map<LazyChunkType, Promise<any>>();

  readonly magickLoadFailed = signal<boolean>(false);
  readonly loadingStatus = signal<{ chunk: LazyChunkType; isLoading: boolean }>({
    chunk: 'mozjpeg',
    isLoading: false
  });

  isChunkLoaded(chunk: LazyChunkType): boolean {
    return this.loadedChunks.has(chunk);
  }

  async ensureChunkLoaded(chunk: LazyChunkType): Promise<any> {
    if (this.loadedChunks.has(chunk)) {
      return true;
    }

    if (this.loadingPromises.has(chunk)) {
      return this.loadingPromises.get(chunk)!;
    }

    this.loadingStatus.set({ chunk, isLoading: true });

    const promise = (async () => {
      try {
        console.log(`[CodecLoaderService] Lazy loading chunk '${chunk}'...`);

        let moduleResult: any = null;
        if (chunk === 'pdf-lib') {
          moduleResult = await import('pdf-lib');
        } else if (chunk === 'pdfjs') {
          moduleResult = await import('pdfjs-dist');
        } else if (chunk === 'jszip') {
          moduleResult = await import('jszip');
        } else if (chunk === 'magick') {
          // Simulate dynamic load check for magick.wasm
          await new Promise(res => setTimeout(res, 120));
          this.magickLoadFailed.set(false);
          moduleResult = { loaded: true };
        } else {
          await new Promise(res => setTimeout(res, 60));
          moduleResult = { loaded: true };
        }

        this.loadedChunks.add(chunk);
        console.log(`[CodecLoaderService] Chunk '${chunk}' loaded successfully.`);
        return moduleResult;
      } catch (err: any) {
        console.error(`[CodecLoaderService] Failed to load chunk '${chunk}':`, err);
        if (chunk === 'magick') {
          this.magickLoadFailed.set(true);
        }
        throw err;
      } finally {
        this.loadingStatus.set({ chunk, isLoading: false });
      }
    })();

    this.loadingPromises.set(chunk, promise);
    return promise;
  }
}
