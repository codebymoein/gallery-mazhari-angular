/**
 * Sharp-based image derivative pipeline.
 * Originals are always retained. Failures are soft — never block ingest.
 */

import { existsSync, mkdirSync } from 'fs';
import { basename, dirname, join } from 'path';

export type DerivativeKey =
  | 'thumb.webp'
  | 'medium.webp'
  | 'large.webp'
  | 'retina.webp'
  | 'thumb.avif'
  | 'medium.avif'
  | 'large.avif';

export interface DerivativeResult {
  derivatives: Partial<Record<DerivativeKey, string>>;
  width: number | null;
  height: number | null;
  errors: string[];
}

const SIZES: Array<{ key: string; edge: number }> = [
  { key: 'thumb', edge: 320 },
  { key: 'medium', edge: 800 },
  { key: 'large', edge: 1600 },
  { key: 'retina', edge: 2400 },
];

const FORMATS: Array<'webp' | 'avif'> = ['webp', 'avif'];

type SharpFactory = (input?: string | Buffer) => {
  metadata: () => Promise<{ width?: number; height?: number }>;
  rotate: () => SharpPipeline;
};

type SharpPipeline = {
  resize: (opts: {
    width: number;
    height: number;
    fit: string;
    withoutEnlargement: boolean;
  }) => SharpPipeline;
  webp: (opts: { quality: number }) => SharpPipeline;
  avif: (opts: { quality: number }) => SharpPipeline;
  toFile: (path: string) => Promise<unknown>;
};

let sharpFactory: SharpFactory | null | undefined;

async function loadSharp(): Promise<SharpFactory | null> {
  if (sharpFactory !== undefined) return sharpFactory;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require('sharp') as SharpFactory & { default?: SharpFactory };
    sharpFactory = mod.default || mod;
    return sharpFactory;
  } catch {
    sharpFactory = null;
    return null;
  }
}

/**
 * Generate WebP/AVIF thumbnails next to the stored original.
 * @param absolutePath absolute filesystem path to original
 * @param publicUrlBase e.g. http://host/uploads/products
 */
export async function generateImageDerivatives(
  absolutePath: string,
  publicUrlBase: string,
): Promise<DerivativeResult> {
  const errors: string[] = [];
  const derivatives: Partial<Record<DerivativeKey, string>> = {};
  let width: number | null = null;
  let height: number | null = null;

  const sharp = await loadSharp();
  if (!sharp) {
    return {
      derivatives,
      width,
      height,
      errors: ['sharp_unavailable'],
    };
  }

  const outDir = join(dirname(absolutePath), '_derivatives');
  if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });

  const stem = basename(absolutePath).replace(/\.[^.]+$/, '');

  try {
    const meta = await sharp(absolutePath).metadata();
    width = meta.width ?? null;
    height = meta.height ?? null;
  } catch (e) {
    errors.push(`metadata:${e instanceof Error ? e.message : 'fail'}`);
    return { derivatives, width, height, errors };
  }

  for (const size of SIZES) {
    for (const format of FORMATS) {
      if (size.key === 'retina' && format === 'avif') continue; // keep retina webp only
      const fileName = `${stem}-${size.key}.${format}`;
      const outPath = join(outDir, fileName);
      const key = `${size.key}.${format}` as DerivativeKey;
      try {
        let pipeline = sharp(absolutePath).rotate().resize({
          width: size.edge,
          height: size.edge,
          fit: 'inside',
          withoutEnlargement: true,
        });
        if (format === 'webp') {
          pipeline = pipeline.webp({ quality: 78 });
        } else {
          pipeline = pipeline.avif({ quality: 55 });
        }
        await pipeline.toFile(outPath);
        derivatives[key] = `${publicUrlBase}/_derivatives/${fileName}`;
      } catch (e) {
        errors.push(`${key}:${e instanceof Error ? e.message : 'fail'}`);
      }
    }
  }

  return { derivatives, width, height, errors };
}
