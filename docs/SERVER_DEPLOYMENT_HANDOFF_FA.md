# سند نیازمندی سرور و انتشار گالری مظهری

این سند برای تحویل به مسئول IT تهیه شده و معماری فعلی پروژه را پوشش می‌دهد: فرانت‌اند Angular، بک‌اند NestJS، دیتابیس PostgreSQL، تصاویر محصولات، پنل مدیریت، پرداخت، ایمیل بازیابی رمز، تلگرام و SMS.

## ۱. ظرفیت مبنا

- حدود ۱۰۰۰ محصول و میانگین ۲ تصویر برای هر محصول؛ در مجموع حداقل ۲۰۰۰ تصویر محصول.
- تصاویر باید هنگام بارگذاری به WebP/AVIF و اندازه‌های نمایشی تبدیل شوند؛ اصل فایل برای بازیابی نگهداری شود.
- برآورد فضای تصاویر بهینه: ۲ تا ۸ گیگابایت. با اصل تصاویر، نسخه‌های مشتق، تصاویر درخواست مشتری، لاگ و بکاپ، کمتر از ۴۰ گیگابایت فضای آزاد توصیه نمی‌شود.
- فضای ذخیره‌سازی تولیدی پیشنهادی: ۱۶۰ گیگابایت NVMe SSD یا فضای Object Storage جداگانه.

## ۲. سرور پیشنهادی

### حداقل قابل‌قبول برای شروع

- VPS لینوکس با ۲ vCPU، رم ۴GB، دیسک ۸۰GB NVMe و حداقل ۲TB ترافیک ماهانه.
- مناسب شروع و ترافیک معمول؛ دیتابیس و فایل‌ها روی همان سرور با بکاپ خارج از سرور.

### پیشنهاد تولیدی

- ۴ vCPU، رم ۸GB، دیسک ۱۶۰GB NVMe، پورت شبکه ۱Gbps و حداقل ۳TB ترافیک ماهانه.
- PostgreSQL روی همان سرور در شروع یا سرویس Managed PostgreSQL با حداقل ۲ vCPU و ۴GB RAM.
- Object Storage سازگار با S3 با حداقل ۵۰ تا ۱۰۰GB برای تصاویر و بکاپ، ترجیحاً دارای CDN و دسترسی پایدار داخل ایران.
- امکان ارتقای CPU/RAM و دیسک بدون تعویض IP.

### سیستم‌عامل و نرم‌افزار

- Ubuntu Server 24.04 LTS x64.
- Node.js 22 LTS، npm سازگار با `package-lock.json`، Nginx، PostgreSQL 16، Git و ابزار SSL.
- اجرای API با systemd یا PM2 و راه‌اندازی خودکار پس از reboot.
- ساعت سرور UTC و نمایش زمان در برنامه با منطقه `Asia/Tehran`.

## ۳. دامنه، DNS و SSL

- دامنه اصلی: `gallery-mazhari.ir` و `www.gallery-mazhari.ir` برای سایت.
- زیردامنه `api.gallery-mazhari.ir` برای API و تصاویر آپلودی.
- در صورت استفاده از CDN/Object Storage، زیردامنه `media.gallery-mazhari.ir`.
- رکوردهای A/AAAA فقط به IP سرور/CDN صحیح؛ حذف رکوردهای قدیمی و متناقض.
- SSL معتبر برای تمام دامنه‌ها با تمدید خودکار؛ TLS 1.2 و 1.3.
- فعال‌سازی HSTS بعد از تأیید نهایی دامنه‌ها و SSL.
- پنل DirectAdmin نباید جایگزین reverse proxy و سرویس Node شود؛ هاست باید اجازه اجرای دائمی Node.js، PostgreSQL و تنظیم Nginx را بدهد. هاست اشتراکی معمولی مناسب این پروژه نیست.

## ۴. معماری انتشار

1. Angular با `npm ci` و `npm run build` ساخته شود و خروجی `dist/.../browser` در مسیر فقط‌خواندنی Nginx قرار گیرد.
2. API با `cd backend && npm ci && npm run build` ساخته و `node dist/main.js` توسط systemd/PM2 اجرا شود.
3. Nginx سایت را به‌صورت SPA سرو کند و درخواست‌های API را به `127.0.0.1:3000` reverse proxy کند.
4. پوشه `backend/uploads` باید خارج از releaseهای موقت یا روی volume پایدار باشد و با هر deploy حذف نشود.
5. دیتابیس تولیدی PostgreSQL باشد؛ SQLite فقط برای توسعه محلی است.
6. migrationهای دیتابیس قبل از سوییچ نسخه جدید و پس از بکاپ اجرا شوند.
7. انتشار به روش release directory و symlink انجام شود تا rollback سریع امکان‌پذیر باشد.

## ۵. متغیرهای محیطی ضروری API

فایل `.env` فقط روی سرور و خارج از Git نگهداری شود:

```env
NODE_ENV=production
PORT=3000
FRONTEND_ORIGIN=https://gallery-mazhari.ir,https://www.gallery-mazhari.ir
BACKEND_PUBLIC_URL=https://api.gallery-mazhari.ir
TRUST_PROXY=true

DB_TYPE=postgres
DB_HOST=127.0.0.1
DB_PORT=5432
DB_USERNAME=gallery_app
DB_PASSWORD=REPLACE_WITH_LONG_RANDOM_SECRET
DB_NAME=gallery_mazhari

JWT_SECRET=REPLACE_WITH_AT_LEAST_64_RANDOM_CHARACTERS
JWT_EXPIRES_IN=7d
ADMIN_SETUP_KEY=REPLACE_WITH_SEPARATE_LONG_RANDOM_SECRET

ADMIN_RECOVERY_EMAIL=moein.molla.7392@gmail.com
SMTP_HOST=REPLACE_WITH_SMTP_HOST
SMTP_PORT=587
SMTP_USER=REPLACE_WITH_SMTP_USER
SMTP_PASSWORD=REPLACE_WITH_SMTP_PASSWORD
SMTP_FROM="Gallery Mazhari <no-reply@gallery-mazhari.ir>"
```

- رمز دیتابیس، JWT، کلید راه‌اندازی مدیر، SMTP، توکن بات، کلید SMS و درگاه نباید داخل کد یا Git قرار گیرند.
- دسترسی فایل `.env` برابر `600` و مالک آن کاربر سرویس API باشد.
- پس از ساخت اولین مدیر، `ADMIN_SETUP_KEY` تعویض یا مسیر bootstrap محدود شود.

## ۶. دیتابیس

- PostgreSQL 16 با کاربر اختصاصی و بدون دسترسی superuser برای برنامه.
- دسترسی پورت 5432 فقط از localhost یا شبکه خصوصی؛ هرگز عمومی نشود.
- بکاپ روزانه `pg_dump`، نگهداری روزانه ۱۴ نسخه، هفتگی ۸ نسخه و ماهانه ۱۲ نسخه.
- حداقل یک نسخه بکاپ خارج از همان سرور و ترجیحاً در موقعیت جغرافیایی دیگر.
- تست بازیابی کامل بکاپ پیش از انتشار و سپس حداقل ماهی یک‌بار.
- مانیتور فضای دیسک، تعداد connection، queryهای کند و خطای migration.

## ۷. تصاویر و فایل‌ها

- محدودیت Nginx برای درخواست‌های آپلود مطابق نیاز پروژه تنظیم شود؛ پیشنهاد عمومی ۲۱۰MB برای import گروهی و محدودیت کوچک‌تر در endpointهای فرم.
- تصاویر محصول: WebP/AVIF، حداکثر ضلع اصلی حدود ۲۰۰۰px و نسخه‌های thumbnail/card/detail.
- تصاویر فرم مشتری فقط JPG/PNG/WebP، کنترل MIME و signature، نام تصادفی، عدم اجرای فایل و عدم دسترسی به مسیر سیستم.
- پاک‌سازی فایل‌های بدون رکورد دیتابیس با job زمان‌بندی‌شده و گزارش قبل از حذف.
- CDN برای تصاویر عمومی با cache طولانی؛ `index.html` بدون cache و فایل‌های hashدار JS/CSS با cache یک‌ساله.
- در صورت نگهداری محلی، `uploads` روزانه بکاپ شود. پیشنهاد بهتر: Object Storage با versioning و lifecycle.

## ۸. تلگرام و SMS

- بات از BotFather ساخته شود؛ کاربر مسئول حداقل یک پیام `/start` به بات بفرستد.
- Chat ID مسئولان یا گروه خصوصی ثبت و بات در گروه عضو شود.
- در پنل «مرکز مدیریت سایت»، حالت ارسال انتخاب شود:
  - `both`: تلگرام و SMS هم‌زمان.
  - `auto`: تلگرام و در صورت خطا SMS.
  - `sms`: فقط SMS برای شرایط قطع اینترنت بین‌الملل.
- پنل SMS باید API داخلی HTTPS، IP whitelist در صورت نیاز، خط ارسال‌کننده، کلید API، محدودیت نرخ و گزارش delivery داشته باشد.
- قالب API فعلی JSON شامل `to`، `text` و `sender` است. اگر ارائه‌دهنده قالب دیگری دارد، adapter اختصاصی قبل از انتشار لازم است.
- خروجی سرور به Telegram API باید در فایروال/دیتاسنتر مجاز باشد؛ برای سناریوی قطع بین‌الملل، سرویس SMS باید کاملاً داخلی باقی بماند.
- تست تلگرام، تست SMS، حالت هر دو و fallback باید روی سرور واقعی انجام شود.

## ۹. ایمیل بازیابی رمز

- SMTP تراکنشی معتبر با SPF، DKIM و DMARC برای دامنه تنظیم شود.
- استفاده از حساب Gmail شخصی برای ارسال تولیدی توصیه نمی‌شود؛ ایمیل `no-reply@gallery-mazhari.ir` یا سرویس SMTP معتبر استفاده شود.
- ایمیل بازیابی مقصد مدیر `moein.molla.7392@gmail.com` است.
- پورت خروجی 587/TLS از سرور باید باز باشد.
- تست inbox، spam، انقضای لینک/توکن و عدم افشای وجود حساب انجام شود.

## ۱۰. درگاه پرداخت

- حساب تجاری درگاه، Merchant ID/API key، دامنه تأییدشده و callback HTTPS لازم است.
- آدرس callback باید روی `api.gallery-mazhari.ir` تعریف شود و از اینترنت قابل دسترسی باشد.
- مبلغ فقط در بک‌اند از سفارش معتبر محاسبه شود؛ نتیجه برگشتی مرورگر منبع اعتماد نیست.
- verify سمت سرور، جلوگیری از پرداخت تکراری، ثبت authority/reference ID و تطبیق مبلغ الزامی است.
- ابتدا sandbox، سپس پرداخت واقعی کم‌مبلغ و سناریوهای موفق، لغو، timeout و callback تکراری تست شوند.
- در صورت الزام درگاه، IP ثابت خروجی سرور به شرکت پرداخت اعلام شود.

## ۱۱. امنیت و شبکه

- فایروال: فقط 22، 80 و 443 عمومی؛ SSH ترجیحاً فقط IPهای شرکت/VPN.
- ورود SSH فقط با کلید، غیرفعال‌کردن password login و root login.
- Fail2ban، به‌روزرسانی امنیتی خودکار، rate limit برای login، بازیابی رمز، فرم‌ها و پرداخت.
- هدرهای CSP، HSTS، X-Content-Type-Options، Referrer-Policy و frame protection مطابق فایل Nginx پروژه.
- CORS فقط برای دامنه واقعی سایت.
- پنل ادمین پشت HTTPS، رمز قوی، نقش‌های حداقلی و خروج sessionهای ناشناس.
- اسکن وابستگی‌ها و اجرای تست‌ها پیش از هر انتشار.
- اطلاعات حساس مشتری در لاگ‌ها ثبت نشود؛ لاگ‌ها rotation و دوره نگهداری مشخص داشته باشند.

## ۱۲. بکاپ، مانیتورینگ و نگهداری

- قاعده 3-2-1: سه نسخه، روی دو رسانه، یک نسخه خارج از سرور.
- بکاپ شامل PostgreSQL، uploads/Object Storage، فایل env رمزنگاری‌شده و تنظیمات Nginx/systemd.
- مانیتور uptime سایت و API، SSL expiry، CPU، RAM، disk، خطاهای 5xx، صف اعلان و شکست پرداخت.
- هشدار فضای دیسک در 70% و هشدار بحرانی در 85%.
- health check داخلی برای API و restart خودکار با محدودیت جهت جلوگیری از loop.
- نگهداری لاگ application و Nginx حداقل ۳۰ روز و audit پنل طبق سیاست شرکت.

## ۱۳. CI/CD پیشنهادی

- branch محافظت‌شده برای production و انتشار فقط پس از build/test موفق.
- مراحل pipeline: نصب قفل‌شده، تست فرانت، build فرانت، تست بک‌اند، build بک‌اند، بکاپ، migration، deploy، smoke test، سوییچ symlink.
- artifact نسخه‌دار و rollback به نسخه قبلی بدون build مجدد.
- secretها فقط در Secret Manager/CI variables؛ هرگز در artifact عمومی.

## ۱۴. چک‌لیست صفر تا انتشار

1. خرید/آماده‌سازی VPS و Object Storage و ثبت دسترسی‌های مالکیتی شرکت.
2. تنظیم DNS، IP ثابت، SSL و زیردامنه‌های سایت/API/media.
3. hardening سیستم‌عامل، کاربر deploy، SSH key و firewall.
4. نصب Node، Nginx و PostgreSQL و ساخت دیتابیس/کاربر اختصاصی.
5. قرار دادن سورس private، ساخت env تولیدی و تولید secretهای قوی.
6. build و تست هر دو پروژه و اجرای migrationها.
7. انتقال تصاویر به storage پایدار و تنظیم cache/CDN.
8. راه‌اندازی systemd/PM2 و reverse proxy Nginx.
9. ساخت مدیر اولیه و تغییر فوری رمز/کلید bootstrap.
10. تنظیم SMTP و تست بازیابی رمز.
11. تنظیم Bot Token و Chat ID، سپس تست تلگرام.
12. دریافت مشخصات API پنل SMS و تست مستقیم، حالت `both` و fallback.
13. تنظیم sandbox درگاه و اجرای تمام سناریوهای پرداخت؛ سپس فعال‌سازی production.
14. واردکردن محصولات، بررسی ۲۰۰۰ تصویر، موجودی، قیمت و دسته‌بندی‌ها.
15. تست موبایل/دسکتاپ، فرم مشاوره، فرم سفارشی، پنل ادمین، سفارش، اعلان و ایمیل.
16. تنظیم بکاپ خودکار و انجام بازیابی آزمایشی.
17. فعال‌سازی مانیتورینگ، هشدارها و ثبت مسئول پاسخ‌گو.
18. تغییر DNS نهایی، smoke test و نگهداری نسخه قبلی برای rollback.

## ۱۵. مواردی که مسئول IT باید تحویل دهد

- IP، مشخصات VPS و دسترسی SSH کلیدی.
- دسترسی DNS و تأیید مالکیت دامنه‌ها.
- مشخصات PostgreSQL یا تأیید نصب محلی.
- محل Object Storage/CDN و کلیدهای محدودشده آن.
- SMTP production و تأیید SPF/DKIM/DMARC.
- Bot Token و Chat IDهای مجاز.
- مستندات API پنل SMS، کلید، sender و IP whitelist.
- Merchant ID/API key و callback مورد تأیید درگاه.
- سیاست بکاپ، محل نسخه خارج سرور و مسئول بازیابی.
- سرویس مانیتورینگ، شماره/ایمیل دریافت هشدار و برنامه نگهداری.

## جمع‌بندی پیشنهادی خرید

برای ۱۰۰۰ محصول و ۲۰۰۰ تصویر، VPS با ۴ vCPU، رم ۸GB و ۱۶۰GB NVMe همراه PostgreSQL 16، Object Storage/CDN حداقل ۱۰۰GB و بکاپ خارج سرور انتخاب متعادل و قابل رشد است. اگر بودجه محدود است، شروع با ۲ vCPU، رم ۴GB و ۸۰GB NVMe ممکن است، اما بکاپ خارجی و امکان ارتقا باید از روز اول فراهم باشد.
