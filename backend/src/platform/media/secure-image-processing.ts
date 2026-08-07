import { createHash } from 'crypto';

export type ProcessedImageFormat = 'jpeg' | 'png' | 'webp' | 'avif' | 'gif';

export interface SanitizedImage {
  buffer: Buffer;
  contentHash: string;
  extension: string;
  contentType: string;
  width: number;
  height: number;
}

export interface GeneratedDerivative {
  key: string;
  buffer: Buffer;
  contentHash: string;
  extension: 'webp' | 'avif';
  contentType: 'image/webp' | 'image/avif';
}

type SharpMetadata = {
  format?: string;
  width?: number;
  height?: number;
};

type SharpPipeline = {
  metadata: () => Promise<SharpMetadata>;
  rotate: () => SharpPipeline;
  resize: (options: {
    width: number;
    height: number;
    fit: 'inside';
    withoutEnlargement: boolean;
  }) => SharpPipeline;
  jpeg: (options?: { quality?: number; mozjpeg?: boolean }) => SharpPipeline;
  png: (options?: { compressionLevel?: number }) => SharpPipeline;
  webp: (options?: { quality?: number }) => SharpPipeline;
  avif: (options?: { quality?: number }) => SharpPipeline;
  gif: () => SharpPipeline;
  toBuffer: () => Promise<Buffer>;
};

type SharpFactory = (
  input: Buffer,
  options?: {
    animated?: boolean;
    failOn?: 'none' | 'truncated' | 'error' | 'warning';
  },
) => SharpPipeline;

let sharpFactory: SharpFactory | null | undefined;

const DERIVATIVE_SIZES = [
  { key: 'thumb', edge: 320 },
  { key: 'medium', edge: 800 },
  { key: 'large', edge: 1600 },
  { key: 'retina', edge: 2400 },
] as const;

function loadSharp(): SharpFactory {
  if (sharpFactory) return sharpFactory;
  if (sharpFactory === null) throw new Error('sharp_unavailable');
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require('sharp') as SharpFactory & { default?: SharpFactory };
    sharpFactory = mod.default || mod;
    return sharpFactory;
  } catch {
    sharpFactory = null;
    throw new Error('sharp_unavailable');
  }
}

export async function sanitizeImageBuffer(
  buffer: Buffer,
): Promise<SanitizedImage> {
  const sharp = loadSharp();
  let metadata: SharpMetadata;
  try {
    metadata = await sharp(buffer, {
      animated: true,
      failOn: 'error',
    }).metadata();
  } catch {
    throw new Error('image_decode_failed');
  }

  const format = normalizeFormat(metadata.format);
  if (!format || !metadata.width || !metadata.height) {
    throw new Error('image_decode_failed');
  }
  if (metadata.width > 12_000 || metadata.height > 12_000) {
    throw new Error('image_dimensions_too_large');
  }
  if (metadata.width * metadata.height > 80_000_000) {
    throw new Error('image_pixel_limit_exceeded');
  }

  // Sharp strips EXIF/IPTC/XMP/ICC metadata by default unless withMetadata()
  // is explicitly requested. Re-encoding also proves the decoder accepts the
  // complete image before the bytes become public.
  let pipeline = sharp(buffer, { animated: true, failOn: 'error' }).rotate();
  switch (format) {
    case 'jpeg':
      pipeline = pipeline.jpeg({ quality: 92, mozjpeg: true });
      break;
    case 'png':
      pipeline = pipeline.png({ compressionLevel: 9 });
      break;
    case 'webp':
      pipeline = pipeline.webp({ quality: 90 });
      break;
    case 'avif':
      pipeline = pipeline.avif({ quality: 70 });
      break;
    case 'gif':
      pipeline = pipeline.gif();
      break;
  }

  let sanitized: Buffer;
  try {
    sanitized = await pipeline.toBuffer();
  } catch {
    throw new Error('image_sanitize_failed');
  }

  let sanitizedMetadata: SharpMetadata;
  try {
    sanitizedMetadata = await sharp(sanitized, {
      animated: true,
      failOn: 'error',
    }).metadata();
  } catch {
    throw new Error('image_sanitize_failed');
  }
  if (!sanitizedMetadata.width || !sanitizedMetadata.height) {
    throw new Error('image_sanitize_failed');
  }

  const descriptor = descriptorFor(format);
  return {
    buffer: sanitized,
    contentHash: sha256(sanitized),
    extension: descriptor.extension,
    contentType: descriptor.contentType,
    width: sanitizedMetadata.width,
    height: sanitizedMetadata.height,
  };
}

export async function generateDerivativeBuffers(
  sanitizedBuffer: Buffer,
): Promise<GeneratedDerivative[]> {
  const sharp = loadSharp();
  const derivatives: GeneratedDerivative[] = [];

  for (const size of DERIVATIVE_SIZES) {
    for (const format of ['webp', 'avif'] as const) {
      if (size.key === 'retina' && format === 'avif') continue;
      let pipeline = sharp(sanitizedBuffer, { failOn: 'error' })
        .rotate()
        .resize({
          width: size.edge,
          height: size.edge,
          fit: 'inside',
          withoutEnlargement: true,
        });
      pipeline =
        format === 'webp'
          ? pipeline.webp({ quality: 78 })
          : pipeline.avif({ quality: 55 });
      const output = await pipeline.toBuffer();
      derivatives.push({
        key: `${size.key}.${format}`,
        buffer: output,
        contentHash: sha256(output),
        extension: format,
        contentType: format === 'webp' ? 'image/webp' : 'image/avif',
      });
    }
  }

  return derivatives;
}

function normalizeFormat(
  format: string | undefined,
): ProcessedImageFormat | null {
  if (format === 'jpg') return 'jpeg';
  if (
    format === 'jpeg' ||
    format === 'png' ||
    format === 'webp' ||
    format === 'avif' ||
    format === 'gif'
  ) {
    return format;
  }
  return null;
}

function descriptorFor(format: ProcessedImageFormat): {
  extension: string;
  contentType: string;
} {
  switch (format) {
    case 'jpeg':
      return { extension: 'jpg', contentType: 'image/jpeg' };
    case 'png':
      return { extension: 'png', contentType: 'image/png' };
    case 'webp':
      return { extension: 'webp', contentType: 'image/webp' };
    case 'avif':
      return { extension: 'avif', contentType: 'image/avif' };
    case 'gif':
      return { extension: 'gif', contentType: 'image/gif' };
  }
}

function sha256(value: Buffer): string {
  return createHash('sha256').update(value).digest('hex');
}
