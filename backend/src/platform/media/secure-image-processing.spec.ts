import sharp from 'sharp';
import {
  generateDerivativeBuffers,
  sanitizeImageBuffer,
} from './secure-image-processing';

describe('secure image processing', () => {
  it('decodes, strips metadata and returns sanitized image metadata', async () => {
    const input = await sharp({
      create: {
        width: 64,
        height: 48,
        channels: 3,
        background: { r: 255, g: 255, b: 255 },
      },
    })
      .jpeg()
      .withMetadata({ orientation: 6 })
      .toBuffer();

    const sanitized = await sanitizeImageBuffer(input);
    const outputMetadata = await sharp(sanitized.buffer).metadata();

    expect(sanitized.extension).toBe('jpg');
    expect(sanitized.contentType).toBe('image/jpeg');
    expect(sanitized.width).toBe(64);
    expect(sanitized.height).toBe(48);
    expect(sanitized.contentHash).toMatch(/^[a-f0-9]{64}$/);
    expect(outputMetadata.exif).toBeUndefined();
    expect(outputMetadata.xmp).toBeUndefined();
    expect(outputMetadata.icc).toBeUndefined();
  });

  it('rejects undecodable bytes', async () => {
    await expect(
      sanitizeImageBuffer(Buffer.from('not-an-image')),
    ).rejects.toThrow('image_decode_failed');
  });

  it('generates content-addressable WebP and AVIF derivatives', async () => {
    const input = await sharp({
      create: {
        width: 1200,
        height: 800,
        channels: 3,
        background: { r: 10, g: 20, b: 30 },
      },
    })
      .png()
      .toBuffer();
    const sanitized = await sanitizeImageBuffer(input);

    const derivatives = await generateDerivativeBuffers(sanitized.buffer);

    expect(derivatives).toHaveLength(7);
    expect(derivatives.map((item) => item.key)).toEqual([
      'thumb.webp',
      'thumb.avif',
      'medium.webp',
      'medium.avif',
      'large.webp',
      'large.avif',
      'retina.webp',
    ]);
    for (const derivative of derivatives) {
      expect(derivative.contentHash).toMatch(/^[a-f0-9]{64}$/);
      expect(['webp', 'avif']).toContain(derivative.extension);
      expect(derivative.buffer.length).toBeGreaterThan(0);
    }
  });
});
