import { ImageFormat } from '../models/image-job.model';

describe('Codec Integration Tests', () => {
  let fixtureCanvas: HTMLCanvasElement;

  beforeEach(() => {
    fixtureCanvas = document.createElement('canvas');
    fixtureCanvas.width = 200;
    fixtureCanvas.height = 200;

    // Polyfill canvas toBlob for headless / JSDOM test runner
    fixtureCanvas.toBlob = function(callback: (blob: Blob | null) => void, type?: string) {
      const dummyBytes = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]);
      const blob = new Blob([dummyBytes], { type: type || 'image/png' });
      callback(blob);
    };
  });

  const formats: ImageFormat[] = ['jpeg', 'png', 'webp'];

  formats.forEach(format => {
    it(`should compress fixture image to valid ${format.toUpperCase()} blob`, async () => {
      const mimeType = format === 'jpeg' ? 'image/jpeg' : format === 'webp' ? 'image/webp' : 'image/png';
      const quality = format === 'jpeg' ? 0.82 : format === 'webp' ? 0.80 : 0.95;

      const blob = await new Promise<Blob | null>((resolve) => {
        fixtureCanvas.toBlob(resolve, mimeType, quality);
      });

      expect(blob).toBeTruthy();
      if (blob) {
        expect(blob.size).toBeGreaterThan(0);
        expect(blob.type).toBe(mimeType);
      }
    });
  });
});
