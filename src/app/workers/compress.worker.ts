/// <reference lib="webworker" />

export interface CompressionJobMessage {
  id: string;
  type: 'compress' | 'resize' | 'enhance' | 'crop-rotate';
  file: File;
  format: string;
  quality: number;
  maxFileSizeKb?: number;
  // Resize params
  targetWidth?: number;
  targetHeight?: number;
  maintainAspectRatio?: boolean;
  // Enhance params
  sharpen?: number;
  contrast?: number;
  noiseReduction?: number;
  // Crop & Rotate params
  cropBox?: { x: number; y: number; width: number; height: number };
  rotationAngle?: number;
  flipHorizontal?: boolean;
  flipVertical?: boolean;
}

export interface WorkerResponseMessage {
  id: string;
  status: 'done' | 'error';
  compressedBlob?: Blob;
  originalSize?: number;
  compressedSize?: number;
  reductionPercentage?: number;
  durationMs?: number;
  errorMessage?: string;
  targetSizeExceeded?: boolean;
}

const MAX_OUTPUT_PIXELS = 64_000_000;

function clampByte(value: number): number {
  return Math.max(0, Math.min(255, Math.round(value)));
}

function applyEnhancements(ctx: OffscreenCanvasRenderingContext2D, width: number, height: number, sharpen: number, contrast: number, noiseReduction: number): void {
  if (!sharpen && !contrast && !noiseReduction) return;

  const imageData = ctx.getImageData(0, 0, width, height);
  const pixels = imageData.data;
  const original = new Uint8ClampedArray(pixels);
  const contrastFactor = (259 * (contrast + 255)) / (255 * (259 - contrast));
  const blurWeight = Math.min(0.45, noiseReduction / 250);
  const sharpenWeight = Math.min(1, sharpen / 100);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const offset = (y * width + x) * 4;
      for (let channel = 0; channel < 3; channel++) {
        let value = original[offset + channel];
        if (blurWeight > 0) {
          let total = 0;
          let samples = 0;
          for (let dy = -1; dy <= 1; dy++) {
            const sampleY = y + dy;
            if (sampleY < 0 || sampleY >= height) continue;
            for (let dx = -1; dx <= 1; dx++) {
              const sampleX = x + dx;
              if (sampleX < 0 || sampleX >= width) continue;
              total += original[(sampleY * width + sampleX) * 4 + channel];
              samples++;
            }
          }
          value = value * (1 - blurWeight) + (total / samples) * blurWeight;
        }
        if (sharpenWeight > 0 && x > 0 && x < width - 1 && y > 0 && y < height - 1) {
          const north = original[((y - 1) * width + x) * 4 + channel];
          const south = original[((y + 1) * width + x) * 4 + channel];
          const west = original[(y * width + x - 1) * 4 + channel];
          const east = original[(y * width + x + 1) * 4 + channel];
          const sharpened = value * 5 - north - south - west - east;
          value = value * (1 - sharpenWeight) + sharpened * sharpenWeight;
        }
        pixels[offset + channel] = clampByte(contrastFactor * (value - 128) + 128);
      }
    }
  }
  ctx.putImageData(imageData, 0, 0);
}

addEventListener('message', async ({ data }: { data: CompressionJobMessage }) => {
  const startTime = performance.now();
  const { id, type, file, format, quality, maxFileSizeKb } = data;

  try {
    const originalSize = file.size;

    // Decode ImageBitmap
    const imageBitmap = await createImageBitmap(file);
    let origWidth = imageBitmap.width;
    let origHeight = imageBitmap.height;

    // Determine target canvas dimensions
    let sourceX = 0;
    let sourceY = 0;
    let sourceWidth = origWidth;
    let sourceHeight = origHeight;
    let destWidth = origWidth;
    let destHeight = origHeight;

    if (type === 'crop-rotate' && data.cropBox) {
      sourceX = Math.min(origWidth - 1, Math.max(0, Math.floor(data.cropBox.x)));
      sourceY = Math.min(origHeight - 1, Math.max(0, Math.floor(data.cropBox.y)));
      sourceWidth = Math.max(1, Math.min(origWidth - sourceX, Math.floor(data.cropBox.width)));
      sourceHeight = Math.max(1, Math.min(origHeight - sourceY, Math.floor(data.cropBox.height)));
      destWidth = sourceWidth;
      destHeight = sourceHeight;
    } else if ((type === 'resize' || type === 'enhance') && data.targetWidth && data.targetHeight) {
      if (data.maintainAspectRatio) {
        const ratio = Math.min(data.targetWidth / origWidth, data.targetHeight / origHeight);
        destWidth = Math.round(origWidth * ratio);
        destHeight = Math.round(origHeight * ratio);
      } else {
        destWidth = data.targetWidth;
        destHeight = data.targetHeight;
      }
    }

    if (typeof OffscreenCanvas === 'undefined') {
      throw new Error('OffscreenCanvas is not supported in this environment');
    }

    // Handle rotation dimensions swap if angle is 90° or 270° (-90°)
    const angleRad = ((data.rotationAngle || 0) * Math.PI) / 180;
    const absAngle = Math.abs(data.rotationAngle || 0);
    const is90or270 = absAngle === 90 || absAngle === 270;

    if (!Number.isFinite(destWidth) || !Number.isFinite(destHeight) || destWidth < 1 || destHeight < 1) {
      throw new Error('Invalid output dimensions');
    }
    const canvasWidth = is90or270 ? destHeight : destWidth;
    const canvasHeight = is90or270 ? destWidth : destHeight;
    if (canvasWidth * canvasHeight > MAX_OUTPUT_PIXELS) {
      throw new Error('Output dimensions exceed the 64 megapixel safety limit');
    }

    const canvas = new OffscreenCanvas(canvasWidth, canvasHeight);
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Failed to obtain OffscreenCanvas 2D context');
    }

    let mimeType = 'image/jpeg';
    if (format === 'webp') mimeType = 'image/webp';
    else if (format === 'png') mimeType = 'image/png';

    if (mimeType === 'image/jpeg') {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    }

    ctx.save();
    // Transform origin for rotation & flipping
    ctx.translate(canvasWidth / 2, canvasHeight / 2);

    // Transform Pipeline Order: Rotate/Flip -> Crop -> Resize -> Enhance (Resize happens via destWidth/destHeight, Enhance is a placeholder)
    if (data.rotationAngle) {
      ctx.rotate(angleRad);
    }

    const scaleX = data.flipHorizontal ? -1 : 1;
    const scaleY = data.flipVertical ? -1 : 1;
    ctx.scale(scaleX, scaleY);

    // Draw image centered
    ctx.drawImage(
      imageBitmap,
      sourceX,
      sourceY,
      sourceWidth,
      sourceHeight,
      -destWidth / 2,
      -destHeight / 2,
      destWidth,
      destHeight
    );
    ctx.restore();
    imageBitmap.close();

    if (type === 'enhance') {
      applyEnhancements(ctx, canvasWidth, canvasHeight, data.sharpen || 0, data.contrast || 0, data.noiseReduction || 0);
    }

    // Export to Blob with quality optimization
    let exportQuality = (quality || 82) / 100;
    let compressedBlob = await canvas.convertToBlob({
      type: mimeType,
      quality: mimeType === 'image/png' ? 1.0 : exportQuality
    });

    let targetSizeExceeded = false;
    // If target maxFileSizeKb is specified, perform binary search quality tuning
    if (maxFileSizeKb && maxFileSizeKb > 0 && mimeType !== 'image/png') {
      const targetBytes = maxFileSizeKb * 1024;
      if (compressedBlob.size > targetBytes) {
        let low = 0.1;
        let high = exportQuality;
        let bestBlob = compressedBlob;
        for (let iter = 0; iter < 5; iter++) {
          const mid = (low + high) / 2;
          const testBlob = await canvas.convertToBlob({ type: mimeType, quality: mid });
          if (testBlob.size <= targetBytes) {
            bestBlob = testBlob;
            low = mid;
          } else {
            // Keep track of the smallest we've seen if we never hit the target
            if (testBlob.size < bestBlob.size) bestBlob = testBlob;
            high = mid;
          }
        }
        compressedBlob = bestBlob;
        if (compressedBlob.size > targetBytes) {
          targetSizeExceeded = true;
        }
      }
    }

    const durationMs = Math.round(performance.now() - startTime);
    const compressedSize = compressedBlob.size;
    const reductionPercentage = Math.max(0, Math.round(((originalSize - compressedSize) / originalSize) * 100));

    const response: WorkerResponseMessage = {
      id,
      status: 'done',
      compressedBlob,
      originalSize,
      compressedSize,
      reductionPercentage,
      durationMs,
      targetSizeExceeded
    };

    postMessage(response);
  } catch (err: any) {
    console.error(`Compress worker error for job ${id}:`, err);
    postMessage({
      id,
      status: 'error',
      errorMessage: err.message || 'Image processing failed inside worker',
      durationMs: Math.round(performance.now() - startTime)
    });
  }
});
