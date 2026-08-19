# گالری مظهری | Gallery Mazhari

فروشگاه و پلتفرم مدیریت یکپارچه فارسی برای محصولات عروس، اکسسوری و خدمات مرتبط. پروژه به‌صورت Full-stack توسعه داده شده و شامل فروشگاه ریسپانسیو Angular، پنل مدیریت و API مستقل NestJS است.

> این مخزن عمومی شامل کد منبع و نمونه تنظیمات است. رمزها، کلیدها، دیتابیس محلی، لاگ‌ها و فایل‌های آپلودی runtime عمداً در Git نگهداری نمی‌شوند.

## امکانات اصلی

### فروشگاه

- رابط فارسی و RTL، ریسپانسیو برای موبایل، تبلت و دسکتاپ
- صفحه اصلی با Hero اسلایدی، دسته‌بندی‌های اصلی و چیدمان ثابت بخش‌های فروشگاه
- کاتالوگ، صفحات دسته و زیردسته، جست‌وجو و جزئیات محصول
- سبد خرید، Checkout، سفارش‌ها و حساب کاربری
- تخفیف‌ها، کالکشن‌ها و Lookbook
- Dream Canvas، پیشنهاد محصول و ابزارهای تعاملی انتخاب استایل
- رزرو مشاوره و درخواست‌های سفارشی
- SEO، Sitemap، داده‌های ساختاریافته و بهینه‌سازی تصاویر

### پنل مدیریت

- ورود امن مبتنی بر JWT و Cookie با نقش‌های مدیر و کارمند
- داشبورد، مدیریت سفارش، مشتریان و CRM
- مدیریت موجودی، محصول، انتشار و صف بازبینی
- ورود گروهی اطلاعات از Excel با Dry Run، اعتبارسنجی و گزارش خطا
- مدیریت تصاویر، دسته‌بندی، تگ‌ها و قواعد هوشمند محصول
- بازاریابی، کد تخفیف، ظاهر سایت و تنظیمات اعلان
- مدیریت کاربران، سطح دسترسی و بازیابی رمز عبور
- ثبت رویدادهای مدیریتی و گزارش‌های عملیاتی

## فناوری‌ها

- Frontend: Angular 21، TypeScript، RxJS، NgRx، CSS Design Tokens
- Backend: NestJS 11، TypeORM، JWT، Passport و bcrypt
- Database: SQLite برای توسعه محلی و PostgreSQL برای استقرار
- Testing: Vitest، Jest و Playwright
- Tooling: ESLint، Angular CLI و npm

## اجرای محلی

پیش‌نیاز: نسخه جدید Node.js و npm.

```powershell
git clone https://github.com/codebymoein/gallery-mazhari-angular.git
cd gallery-mazhari-angular
npm install
npm --prefix backend install
Copy-Item backend/.env.example backend/.env
```

فرانت‌اند را در یک ترمینال اجرا کنید:

```powershell
npm start
```

بک‌اند را در ترمینال دوم اجرا کنید:

```powershell
npm run backend:start
```

- فروشگاه: `http://localhost:4200`
- ورود پنل مدیریت: `http://localhost:4200/admin/login`
- API: `http://localhost:3000/api`

برای اولین مدیر، مقدار امن و اختصاصی `ADMIN_SETUP_KEY` را در `backend/.env` تنظیم و از endpoint راه‌اندازی مدیر استفاده کنید. اطلاعات واقعی محیط production را هرگز commit نکنید.

## فرمان‌های مهم

```powershell
npm run build
npm test
npm run lint
npm run e2e
npm --prefix backend test -- --runInBand
npm --prefix backend run build
```

## ساختار پروژه

```text
src/app/             Angular application
src/app/features/    Storefront and admin features
src/app/core/        Services, guards, interceptors and state
src/app/shared/      Shared models, data and UI utilities
backend/src/         NestJS API and business modules
backend/uploads/     Local runtime uploads (not tracked)
backend/data/        Local SQLite data (not tracked)
docs/                Architecture, API and deployment documentation
e2e/                 Playwright end-to-end tests
deploy/              Deployment configuration
```

## امنیت و استقرار

- فایل‌های `.env`، دیتابیس، لاگ و آپلودهای runtime توسط `.gitignore` محافظت می‌شوند.
- تمام secretها باید از متغیرهای محیطی یا Secret Manager تأمین شوند.
- برای production از HTTPS، PostgreSQL، reverse proxy مطمئن و secretهای تصادفی طولانی استفاده کنید.
- CORS، Helmet، ValidationPipe، نقش‌ها و Permission Guard در بک‌اند اعمال شده‌اند.
- گزارش آسیب‌پذیری را مطابق [SECURITY.md](SECURITY.md) ارسال کنید.

راهنماهای جزئی‌تر در پوشه [`docs`](docs) قرار دارند.

## وضعیت پروژه

- Waves 0 تا 3 برنامه اصلاحات تکمیل شده‌اند و جزئیات تاریخی آن‌ها در Git و Pull Requestهای Merge‌شده باقی مانده است.
- گواهی نهایی انتشار و راه‌اندازی کنترل‌شده در [`docs/remediation/MASTER_REMEDIATION_ROADMAP.md`](docs/remediation/MASTER_REMEDIATION_ROADMAP.md) پیگیری می‌شود.
- تغییرات محصول و طراحی از [`docs/product/BACKLOG.md`](docs/product/BACKLOG.md) وارد جریان توسعه می‌شوند.

پروژه همچنان در حال توسعه فعال است. استقرار Production به تنظیم سرویس‌های بیرونی، PostgreSQL، ایمیل، پیامک و پرداخت متناسب با محیط مقصد نیاز دارد.

## مالکیت

تمام حقوق طراحی، محتوا و برند گالری مظهری محفوظ است. عمومی بودن مخزن به معنی واگذاری حقوق تجاری دارایی‌ها نیست.
