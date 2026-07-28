/**
 * فشرده‌سازی تصویر سمت کلاینت قبل از ذخیره‌سازی.
 * عکس‌های صف انتشار در localStorage نگهداری می‌شوند؛ بدون فشرده‌سازی،
 * چند عکس موبایلی سهمیه ~5MB مرورگر را پر می‌کند.
 */

const DEFAULT_MAX_DIMENSION = 1200;
const DEFAULT_QUALITY = 0.82;

export async function fileToCompressedDataUrl(
  file: File,
  maxDimension = DEFAULT_MAX_DIMENSION,
  quality = DEFAULT_QUALITY
): Promise<string> {
  try {
    const image = await loadImage(file);
    const scale = Math.min(
      1,
      maxDimension / Math.max(image.width, image.height)
    );
    const width = Math.max(1, Math.round(image.width * scale));
    const height = Math.max(1, Math.round(image.height * scale));

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return readAsDataUrl(file);
    }
    ctx.drawImage(image, 0, 0, width, height);

    const dataUrl = canvas.toDataURL('image/jpeg', quality);
    // اگر خروجی به هر دلیل خالی بود، به خواندن مستقیم فایل برگرد
    return dataUrl && dataUrl.startsWith('data:image/') ? dataUrl : readAsDataUrl(file);
  } catch {
    return readAsDataUrl(file);
  }
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error(`خطا در بارگذاری تصویر ${file.name}`));
    };
    img.src = url;
  });
}

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () =>
      resolve(typeof reader.result === 'string' ? reader.result : '');
    reader.onerror = () => reject(new Error(file.name));
    reader.readAsDataURL(file);
  });
}
