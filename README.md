# گالری مظهری - Angular

نسخه Angular از فروشگاه آنلاین لوکس لباس عروس و اکسسوری عروسی - **گالری مظهری**.

## 📋 معلومات پروژه

- **نام پروژه:** Gallery Mazhari Angular
- **زبان اول:** فارسی (RTL)
- **Framework:** Angular 18+
- **State Management:** NgRx
- **Styling:** CSS + Design Tokens
- **Package Manager:** npm

## 🚀 شروع سریع

### پیش‌نیازها
- Node.js 18+
- npm 9+

### نصب و اجرا

```bash
# نصب وابستگی‌ها
npm install

# اجرای development server
npm start
# یا
npm run dev

# ساخت برای production
npm run build:prod

# اجرای tests
npm test

# Linting
npm run lint
```

سرور development در `http://localhost:4200` قابل دسترسی خواهد بود.

## 📁 ساختار پروژه

```
src/
├── app/
│   ├── core/              # Services، Guards، Interceptors
│   │   ├── api/
│   │   ├── guards/
│   │   ├── interceptors/
│   │   └── services/
│   ├── shared/            # Shared Components، Pipes، Models
│   │   ├── components/
│   │   ├── directives/
│   │   ├── pipes/
│   │   └── models/
│   ├── features/          # Feature Modules
│   │   ├── home/
│   │   ├── catalog/
│   │   ├── product/
│   │   ├── cart/
│   │   ├── dream-canvas/
│   │   ├── looks/
│   │   ├── consultation/
│   │   └── account/
│   ├── admin/             # Admin Dashboard
│   ├── layout/            # Layout Components
│   ├── app.component.ts
│   └── app.routes.ts
├── styles/                # Global Styles
│   ├── tokens.css         # Design Tokens
│   ├── typography.css
│   ├── rtl.css
│   └── global.css
├── assets/
│   ├── images/
│   ├── fonts/
│   └── icons/
├── environments/
└── main.ts
```

## 🎨 Design Tokens

تمام رنگ‌ها، فونت‌ها و spacing مطابق با استاندارد‌های لوکس گالری مظهری است:

```css
--color-gold-primary: #B8973E;
--color-gold-light: #D4AF37;
--color-dark-charcoal: #1A1A1A;
--color-bg-cream: #F9F8F6;
--font-persian: 'IRANSansX', 'YekanBakh', Tahoma, sans-serif;
--font-serif-en: 'Playfair Display', serif;
```

## 🔄 Routing

صفحات اصلی:

| مسیر | توضیح |
|-----|------|
| `/` | صفحه اصلی |
| `/catalog` | کاتالوگ محصولات |
| `/product/:id` | جزئیات محصول |
| `/looks` | استایل‌های کیوریشن |
| `/look/:id` | جزئیات استایل |
| `/cart` | سبد خریدی |
| `/dream-canvas` | مودبورد شخصی |
| `/consultation` | درخواست مشاوره |
| `/account` | پروفایل کاربری |

## 🔌 API Integration

پروژه از WordPress REST API برای دریافت داده‌های محصول، استایل‌ها و دیگر اطلاعات استفاده می‌کند:

```
GET    /wp-json/wc/v3/products
GET    /wp-json/wc/v3/products/:id
GET    /wp-json/wc/v3/product_categories
POST   /wp-json/mazhari/v1/dream-canvas
GET    /wp-json/mazhari/v1/curated-looks
POST   /wp-json/mazhari/v1/consultation-request
```

## 📱 RTL Support

پروژه از اول برای پشتیبانی RTL (فارسی) طراحی شده است:

- تمام layout‌ها logical properties استفاده می‌کنند
- جهت صفحه خودکار تنظیم می‌شود
- فارسی به‌عنوان زبان اول در نظر گرفته شده است

## 🧪 Testing

```bash
# Unit Tests
npm test

# E2E Tests (پس از تکمیل)
npm run e2e
```

## 📦 State Management

پروژه از **NgRx** برای مدیریت state استفاده می‌کند:

- **Actions:** کارهایی که باید انجام شوند
- **Reducers:** تغییر state
- **Selectors:** انتخاب داده‌ها از state
- **Effects:** Side effects

## 🌐 نکات مهم

### Accessibility
- تمام کنترل‌ها دارای labels دقیق فارسی هستند
- WCAG 2.2 AA compliance
- Keyboard navigation فعال

### Performance
- Lazy loading برای route‌ها
- Image optimization
- Code splitting
- Tree shaking

### SEO
- Meta tags
- Schema markup
- Sitemap
- Semantic HTML

## 🔐 Security

- HTTPS enforcement
- CSRF protection
- XSS prevention
- Input validation
- Secure headers

## 📚 مستندات

- [Angular Documentation](https://angular.dev)
- [NGRx Documentation](https://ngrx.io)
- [WordPress REST API](https://developer.wordpress.org/rest-api/)

## 🤝 مشارکت

لطفاً تغییرات را از طریق pull request ارسال کنید.

## 📄 License

تمام حقوق محفوظ است - گالری مظهری

## 📞 تماس

برای سوالات یا پیشنهادات با تیم تیم تماس بگیرید.

---

**آخرین بروزرسانی:** ۲۴ تیر ۱۴۰۵
