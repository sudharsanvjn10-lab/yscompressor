export type SubPoolTarget = 'image' | 'pdf';

export const JOB_SUBPOOL_MAP: Record<string, SubPoolTarget> = {
  compress: 'image',
  resize: 'image',
  enhance: 'image',
  'img-to-pdf': 'pdf',
  'pdf-to-img': 'pdf'
};
