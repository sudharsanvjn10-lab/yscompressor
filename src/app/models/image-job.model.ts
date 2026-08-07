// OffscreenCanvas can reliably encode these formats across supported browsers.
export type ImageFormat = 'jpeg' | 'png' | 'webp';
export type JobType = 'compress' | 'resize' | 'enhance' | 'crop-rotate' | 'img-to-pdf' | 'pdf-to-img';
export type JobStatus = 'queued' | 'processing' | 'done' | 'error';

export interface BaseJob {
  id: string;
  type: JobType;
  name: string;
  originalSize: number;
  status: JobStatus;
  thumbnailUrl?: string;
  errorMessage?: string;
  durationMs?: number;
  format?: ImageFormat;
  compressedSize?: number;
  reductionPercentage?: number;
  compressedBlob?: Blob;
  resultUrl?: string;
  targetSizeExceeded?: boolean;
}

export interface CompressJob extends BaseJob {
  type: 'compress';
  file: File;
  format: ImageFormat;
  quality: number;
  maxFileSizeKb?: number;
}

export interface ResizeJob extends BaseJob {
  type: 'resize';
  file: File;
  targetWidth: number;
  targetHeight: number;
  maintainAspectRatio: boolean;
  format: ImageFormat;
  quality: number;
}

export interface EnhanceJob extends BaseJob {
  type: 'enhance';
  file: File;
  sharpen: number;
  contrast: number;
  noiseReduction: number;
  format: ImageFormat;
  quality: number;
}

export interface CropRotateJob extends BaseJob {
  type: 'crop-rotate';
  file: File;
  cropBox?: { x: number; y: number; width: number; height: number };
  rotationAngle?: number; // -180 to 180
  flipHorizontal?: boolean;
  flipVertical?: boolean;
  format: ImageFormat;
  quality: number;
}

export interface ImageToPdfJob extends BaseJob {
  type: 'img-to-pdf';
  files: File[];
  pageSize: 'a4' | 'letter' | 'auto';
  outputPdfBlob?: Blob;
}

export interface PdfToImageJob extends BaseJob {
  type: 'pdf-to-img';
  pdfFile: File;
  outputFormat: 'png' | 'jpeg';
  scale: number;
  renderedPages?: { pageNum: number; blob: Blob; url: string }[];
  currentRenderingPage?: number;
  totalPages?: number;
}

export type ImageJob = CompressJob | ResizeJob | EnhanceJob | CropRotateJob | ImageToPdfJob | PdfToImageJob;

export interface CompressionSettings {
  format: ImageFormat;
  mode: 'quality' | 'targetSize';
  jpegQuality: number;
  webpQuality: number;
  pngLossless: boolean;
  targetSizeKb: number;
}
