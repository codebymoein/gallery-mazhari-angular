/**
 * Shared asset URL helper — ensures category/product images resolve under any base href.
 */
import { environment } from '@env/environment';

// Bump when bundled visual assets are redeployed. This also recovers clients
// that cached an interrupted/empty image response on unreliable mobile links.
const BUNDLED_ASSET_VERSION = '20260803-mobile-2';

export function assetUrl(path: string | undefined | null): string {
  if (!path) return '';
  const trimmed = path.trim();
  if (!trimmed) return '';
  if (
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('data:') ||
    trimmed.startsWith('blob:')
  ) {
    return trimmed;
  }
  const localPath = `/${trimmed.replace(/^\.?\//, '')}`;
  const versionedLocalPath = localPath.startsWith('/assets/')
    ? `${localPath}${localPath.includes('?') ? '&' : '?'}v=${BUNDLED_ASSET_VERSION}`
    : localPath;
  // Bundled application assets are served by the frontend host. Only uploaded
  // media belongs to the optional media host.
  const isUpload = localPath.startsWith('/uploads/');
  const mediaBase = isUpload
    ? environment.mediaBaseUrl?.replace(/\/+$/, '') || ''
    : '';
  return mediaBase ? `${mediaBase}${localPath}` : versionedLocalPath;
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
  // Safari can emit a transient decode/load error under memory or connection
  // pressure. Retry the original URL once instead of permanently replacing a
  // valid image with the fallback poster.
  if (img.dataset['retryApplied'] !== '1') {
    img.dataset['retryApplied'] = '1';
    const original = img.currentSrc || img.src;
    const separator = original.includes('?') ? '&' : '?';
    window.setTimeout(() => {
      img.src = `${original}${separator}retry=1`;
    }, 150);
    return;
  }
  img.dataset['fallbackApplied'] = '1';
  img.src = CATEGORY_IMAGE_FALLBACK;
}
