# راه‌اندازی بات، SMS جایگزین و آماده‌سازی هاست

## آنچه در پروژه پیاده‌سازی شده است

- ثبت دائمی درخواست مشاوره در دیتابیس بک‌اند به‌جای اتکا به مرورگر.
- ارسال اطلاعات کامل درخواست مشاوره: نام، موبایل، تاریخ مراسم، زمان تماس، محصول، منبع، توضیحات و اقلام بوم رویایی.
- ارسال سفارش فقط پس از تأیید واقعی پرداخت، شامل مشتری، آدرس، اقلام، مبالغ، روش ارسال و شماره پیگیری.
- حالت‌های `auto`، `telegram`، `sms`، `both` و `disabled`.
- در حالت `auto` ابتدا Telegram Bot API امتحان می‌شود و در خطا/timeout، API پیامک داخلی فراخوانی می‌شود.
- پشتیبانی از چند Chat ID و چند شماره مسئول.
- ثبت نتیجه هر ارسال در جدول `notification_deliveries`؛ خطا بی‌صدا گم نمی‌شود.
- دکمه تست مجزای تلگرام و SMS در پنل «ظاهر و تنظیمات سایت».

## ساخت بات تلگرام توسط مالک سایت

1. در تلگرام حساب رسمی `@BotFather` را باز کنید و `/newbot` را بزنید.
2. نام و username بات را تعیین و token را دریافت کنید. Token حکم رمز عبور دارد؛ آن را در پیام عمومی یا Git قرار ندهید.
3. هر مسئولی که باید پیام بگیرد، بات را باز کند و `Start` را بزند. برای گروه، بات را به گروه اضافه کنید.
4. برای پیدا کردن Chat ID، موقتاً در مرورگر یا ابزار API این آدرس را با token واقعی باز کنید:
   `https://api.telegram.org/bot<TOKEN>/getUpdates`
   سپس مقدار `message.chat.id` را بردارید. Chat ID گروه معمولاً منفی است.
5. در پنل ادمین، بخش «بات تلگرام و پیامک مسئولان»، token و Chat IDها را وارد کنید و «تست تلگرام» را بزنید.
6. بعد از اطمینان، حالت را روی `auto` یا `both` و گزینه فعال را روشن کنید.

## تهیه و اتصال پنل SMS ایرانی

پنلی انتخاب کنید که API ارسال خدماتی، امکان ارسال به لیست سیاه، HTTPS و IP whitelist قابل مدیریت داشته باشد. از شرکت ارائه‌دهنده این موارد را بگیرید:

- URL دقیق API ارسال
- API key و شیوه ارسال آن در header
- شماره/خط خدماتی ارسال‌کننده
- نمونه request و response رسمی
- محدودیت نرخ، طول پیام و وضعیت تحویل
- IP سرور مجاز برای whitelist

قرارداد عمومی فعلی پروژه چنین JSONای ارسال می‌کند:

```json
{
  "to": "09xxxxxxxxx",
  "text": "متن اعلان",
  "sender": "خط خدماتی"
}
```

کلید پیش‌فرض به شکل `Authorization: Bearer <API_KEY>` ارسال می‌شود و نام header و پیشوند در پنل قابل تغییر است. اگر پنل انتخابی قرارداد متفاوتی دارد (برای مثال URL پارامتری، نام‌های `receptor/message` یا pattern code)، باید adapter همان ارائه‌دهنده به `NotificationsService.sendSms` افزوده شود؛ نمونه مستندات رسمی پنل را ارائه کنید تا دقیق پیاده‌سازی شود.

برای آزمون قطع اینترنت بین‌الملل، پس از فعال‌کردن حالت `auto`، دسترسی خروجی سرور به `api.telegram.org:443` را موقتاً در staging مسدود کنید و یک درخواست مشاوره آزمایشی بفرستید. باید delivery با کانال `sms-fallback` ثبت شود. این تست را روی production و بدون هماهنگی انجام ندهید.

## ارزیابی تصویر هاست موجود

تصویر فقط ورود فعال DirectAdmin به میزبان `server81r.irwebspace.com:2223` و IP `5.215.248.214` را اثبات می‌کند. از این صفحه نمی‌توان وجود Node.js، SSH، PostgreSQL، RAM، فضای دیسک، reverse proxy یا دسترسی outbound را نتیجه گرفت.

در DirectAdmin یا از پشتیبانی هاست، موارد زیر را بررسی و نتیجه/تصویرشان را تهیه کنید:

1. `System Info & Files` → نسخه سیستم‌عامل، RAM، فضای آزاد و CPU.
2. وجود `SSH Keys` یا Terminal و امکان اجرای process دائمی.
3. وجود `Node.js Selector / Application Manager` با Node.js 20 یا 22.
4. امکان ساخت PostgreSQL و دریافت host/port/database/user/password؛ MySQL جایگزین مستقیم این پروژه نیست.
5. امکان تعریف reverse proxy برای `api.domain.ir` به پورت داخلی Node.
6. امکان نصب SSL برای دامنه اصلی و زیردامنه API.
7. امکان تعریف environment variables خارج از `public_html`.
8. outbound HTTPS به `api.telegram.org`، دامنه پنل SMS و زرین‌پال.
9. cron یا process manager برای اجرای دائمی، restart خودکار و jobهای نگهداری.
10. backup زمان‌بندی‌شده دیتابیس و uploads با امکان restore.

اگر هاست فقط اشتراکی PHP/WordPress باشد و Node process، PostgreSQL یا reverse proxy ندهد، بک‌اند NestJS روی آن قابل اجرای مطمئن نیست. در آن حالت فرانت‌اند روی همین هاست قرار می‌گیرد و بک‌اند باید روی VPS/سرویس Node جدا اجرا شود.

## حداقل چیزهایی که باید به هاست افزوده یا فعال شود

- Node.js LTS 20/22 و npm
- PostgreSQL 14 یا جدیدتر
- process manager مانند systemd، PM2 یا Application Manager هاست
- Nginx/Apache reverse proxy و SPA fallback
- دامنه‌های `gallery-mazhari.ir` و `api.gallery-mazhari.ir` با HTTPS
- حداقل 1 GB RAM برای اجرای سبک؛ 2 GB یا بیشتر برای build روی سرور
- فضای پایدار و backup برای uploads، یا object storage سازگار
- دسترسی outbound روی پورت 443
- متغیرهای production با secretهای قوی

## روند انتقال پیشنهادی

1. از دیتابیس و uploads فعلی backup بگیرید.
2. build فرانت‌اند را محلی تولید و محتوای `dist/.../browser` را به document root دامنه اصلی منتقل کنید.
3. بک‌اند را جداگانه deploy کنید؛ روی سرور فقط dependencyهای production نصب و `npm run build` اجرا شود، یا artifact آماده منتقل شود.
4. متغیرهای `NODE_ENV=production`، `DB_*`، `JWT_SECRET`، `ADMIN_SETUP_KEY`، `FRONTEND_ORIGIN` و `BACKEND_PUBLIC_URL` را تعریف کنید.
5. `npm run migration:run` را فقط پس از backup روی دیتابیس production اجرا کنید.
6. reverse proxy و فایل نمونه `deploy/nginx.conf.example` را با دامنه واقعی تطبیق دهید.
7. ابتدا Telegram/SMS و سپس درگاه را در sandbox تست کنید.
8. health endpoint، ورود ادمین، ثبت مشاوره، اعلان fallback، سفارش و callback پرداخت را smoke-test کنید.

هیچ‌کدام از tokenها، API keyها، رمز دیتابیس یا `.env` نباید در `public_html`، بسته فرانت‌اند یا Git قرار بگیرد.
