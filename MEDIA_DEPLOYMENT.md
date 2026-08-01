# استقرار مستقل تصاویر و فایل‌های حجیم

در نسخه توسعه، تصاویر همچنان از پوشه `src/assets` و همان localhost خوانده می‌شوند.
در build تولید، مسیرهای محلی محصولات به دامنه زیر تبدیل می‌شوند:

`https://media.gallery-mazhari.ir/assets/...`

## راه‌اندازی

1. یک فضای Object Storage یا CDN برای دامنه `media.gallery-mazhari.ir` بسازید.
2. محتوای پوشه `src/assets` را با حفظ ساختار پوشه‌ها در مسیر `/assets/` آن فضا بارگذاری کنید.
3. DNS دامنه `media.gallery-mazhari.ir` را به CDN یا Object Storage متصل کنید.
4. برای تصاویر هدرهای Cache-Control طولانی تنظیم کنید:
   `public, max-age=31536000, immutable`
5. اپ Angular را جداگانه build و deploy کنید:
   `npm run build`
6. اگر دامنه رسانه تغییر کرد، فقط `mediaBaseUrl` را در
   `src/environments/environment.prod.ts` تغییر دهید.

فایل‌های عکس محصول بهتر است WebP یا AVIF، با عرض‌های استاندارد 480، 800 و 1200
پیکسل تولید شوند. نام فایل نسخه‌دار یا محتوایی باشد تا کش یک‌ساله امن بماند.
