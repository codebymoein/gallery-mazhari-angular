/**
 * Shared asset URL helper — ensures category/product images resolve under any base href.
 */
export function assetUrl(path: string | undefined | null): string {
  if (!path) return '';
  const trimmed = path.trim();
  if (!trimmed) return '';
  if (
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('data:') ||
    trimmed.startsWith('blob:') ||
    trimmed.startsWith('/')
  ) {
    return trimmed;
  }
  return `/${trimmed.replace(/^\.\//, '')}`;
}

/** Fallback gradient poster when an image fails to load (inline SVG). */
export const CATEGORY_IMAGE_FALLBACK =
  'data:image/svg+xml,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600">
      <defs>
        <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#1a1510"/>
          <stop offset="55%" stop-color="#0a0a0a"/>
          <stop offset="100%" stop-color="#2a2418"/>
        </linearGradient>
      </defs>
      <rect width="800" height="600" fill="url(#g)"/>
      <circle cx="220" cy="160" r="120" fill="#b8973e" fill-opacity="0.12"/>
      <text x="400" y="310" text-anchor="middle" fill="#d4af37" font-family="Georgia, serif" font-size="28">Gallery Mazhari</text>
    </svg>`
  );

export function onImgErrorUseFallback(event: Event): void {
  const img = event.target as HTMLImageElement;
  if (img.dataset['fallbackApplied'] === '1') return;
  img.dataset['fallbackApplied'] = '1';
  img.src = CATEGORY_IMAGE_FALLBACK;
}
