import { describe, expect, it } from 'vitest';
import { assetUrl, CATEGORY_IMAGE_FALLBACK } from './asset-url';

describe('assetUrl', () => {
  it('preserves trusted browser-resolvable URL schemes', () => {
    expect(assetUrl('https://example.test/image.webp')).toBe(
      'https://example.test/image.webp',
    );
    expect(assetUrl('data:image/png;base64,AA==')).toBe(
      'data:image/png;base64,AA==',
    );
    expect(assetUrl('blob:https://example.test/id')).toBe(
      'blob:https://example.test/id',
    );
  });

  it('normalizes and versions bundled asset paths while preserving empty input', () => {
    expect(assetUrl('assets/images/item.webp')).toMatch(
      /^\/assets\/images\/item\.webp\?v=/,
    );
    expect(assetUrl('./assets/images/item.webp')).toMatch(
      /^\/assets\/images\/item\.webp\?v=/,
    );
    expect(assetUrl('   ')).toBe('');
    expect(assetUrl(undefined)).toBe('');
  });

  it('provides an inline fallback without a network dependency', () => {
    expect(CATEGORY_IMAGE_FALLBACK).toMatch(/^data:image\/svg\+xml,/);
  });
});
