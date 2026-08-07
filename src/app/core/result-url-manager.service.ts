import { Injectable, OnDestroy } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ResultUrlManagerService implements OnDestroy {
  private activeUrls = new Map<string, string>(); // key: jobId/itemId, value: blobUrl

  createUrl(key: string, blob: Blob): string {
    // Revoke previous URL if key already exists
    if (this.activeUrls.has(key)) {
      this.revoke(key);
    }

    const url = URL.createObjectURL(blob);
    this.activeUrls.set(key, url);
    return url;
  }

  revoke(key: string): void {
    const url = this.activeUrls.get(key);
    if (url) {
      URL.revokeObjectURL(url);
      this.activeUrls.delete(key);
    }
  }

  revokeAll(): void {
    for (const [key, url] of this.activeUrls.entries()) {
      URL.revokeObjectURL(url);
    }
    this.activeUrls.clear();
  }

  ngOnDestroy(): void {
    this.revokeAll();
  }
}
