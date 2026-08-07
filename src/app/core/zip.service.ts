import { Injectable } from '@angular/core';
import JSZip from 'jszip';
import { ImageJob } from '../models/image-job.model';

@Injectable({
  providedIn: 'root'
})
export class ZipService {
  async downloadZip(completedJobs: ImageJob[], zipFilename = 'YS-Compressor-Media-Output.zip'): Promise<void> {
    if (!completedJobs || completedJobs.length === 0) return;

    const zip = new JSZip();

    for (const job of completedJobs) {
      if (job.status !== 'done') continue;

      const baseName = job.name.replace(/\.[^/.]+$/, '');

      if (job.type === 'img-to-pdf' && job.outputPdfBlob) {
        zip.file(`${baseName}.pdf`, job.outputPdfBlob);
      } else if (job.type === 'pdf-to-img' && job.renderedPages && job.renderedPages.length > 0) {
        const fmt = job.outputFormat || 'png';
        const pageFolder = zip.folder(baseName) || zip;
        job.renderedPages.forEach(p => {
          pageFolder.file(`page_${p.pageNum}.${fmt}`, p.blob);
        });
      } else if (job.compressedBlob) {
        const ext = job.format === 'jpeg' ? '.jpg' : `.${job.format || 'jpg'}`;
        zip.file(`${baseName}-compressed${ext}`, job.compressedBlob);
      }
    }

    const content = await zip.generateAsync({ type: 'blob' });
    this.triggerDownload(content, zipFilename);
  }

  triggerDownload(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
}
