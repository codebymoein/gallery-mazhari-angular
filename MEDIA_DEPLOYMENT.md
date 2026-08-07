# استقرار مستقل تصاویر و فایل‌های حجیم

این سند دو نوع media را از هم جدا می‌کند:

1. **Static frontend assets** که همراه Angular توسعه داده می‌شوند و ممکن است از CDN سرو شوند.
2. **Runtime product media** که از پنل/ZIP وارد workflow رسانه می‌شوند و در production باید از طریق NestJS در S3-compatible Object Storage ذخیره شوند.

## Runtime product media — قرارداد production

PostgreSQL منبع اصلی metadata، وضعیت workflow، اتصال عکس به محصول و audit است. Object Storage فقط محل durable binaryهاست و جای دیتابیس را نمی‌گیرد.

در production این متغیرها باید از secret/environment استقرار تأمین شوند:

- `MEDIA_STORAGE_DRIVER=s3`
- `MEDIA_S3_ENDPOINT`
- `MEDIA_S3_REGION`
- `MEDIA_S3_BUCKET`
- `MEDIA_S3_ACCESS_KEY_ID`
- `MEDIA_S3_SECRET_ACCESS_KEY`
- `MEDIA_PUBLIC_BASE_URL`، معمولاً `https://media.gallery-mazhari.ir`
- `MEDIA_MALWARE_SCAN_MODE=http`
- `MEDIA_MALWARE_SCAN_URL`

credentialها فقط در backend هستند و نباید داخل Angular، Git یا URL عمومی قرار بگیرند.

### Secure ingest pipeline

Runtime media قبل از attachment این ترتیب را طی می‌کند:

`signature/size validation → malware scan → decode/dimension validation → metadata stripping/re-encode → dedupe → original storage → derivative generation/storage → product attach + media record`

- production بدون scanner معتبر start نمی‌شود.
- scanner timeout/error/invalid response به‌صورت fail-closed باعث quarantine می‌شود، نه public attachment.
- decode با Sharp انجام می‌شود و ابعاد بیش از `12000×12000` یا بیش از 80 میلیون pixel رد می‌شوند.
- EXIF/IPTC/XMP/ICC با re-encode سمت سرور حذف می‌شود.
- derivativeهای responsive به‌صورت WebP/AVIF در Object Storage ذخیره می‌شوند؛ failure در derivative generation/storage workflow را موفق علامت نمی‌زند.

### Namespace و cache

- تصاویر عمومی محصول: `public/<sha-prefix>/<sha256>.<ext>`
- فایل‌های private/quarantine: `private/<sha-prefix>/<sha256>.<ext>`
- public objectها به‌دلیل content-addressed بودن می‌توانند `Cache-Control: public, max-age=31536000, immutable` داشته باشند.
- private/quarantine objectها نباید public URL یا مسیر public static داشته باشند.

### Reconciliation

Endpoint محافظت‌شده `GET /platform/media/reconciliation` با permission `media.manage` گزارش read-only از این موارد می‌دهد:

- original objectهای مفقود؛
- derivative objectهای مفقود؛
- attached assetهایی که دیگر در product photos reference ندارند؛
- product photoهایی که media asset متناظر ندارند؛
- legacy/non-content-addressed references؛
- خطاهای provider هنگام existence check.

این endpoint هیچ repair یا delete انجام نمی‌دهد. حذف/backfill خودکار legacy originals خارج از PR-013 است و فقط بعد از recovery evidence مجاز خواهد بود.

## Static frontend assets

در development، assetهای Angular می‌توانند از `src/assets` و localhost خوانده شوند. برای production می‌توان `src/assets` را با حفظ ساختار در CDN/Object Storage منتشر کرد و `mediaBaseUrl` عمومی Angular را مطابق محیط تنظیم کرد. این مسیر static مستقل از credentialها و runtime upload contract است.

## Recovery

تعویض سرور application نباید original media جدید را از بین ببرد. Backup/restore و lifecycle نهایی Object Storage طبق RM-11/PR-014 و PR-015 تکمیل می‌شود. قبل از حذف هر local original قدیمی باید backfill، checksum/reconciliation و recovery evidence وجود داشته باشد.
