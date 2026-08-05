import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit,
  effect,
  inject
} from '@angular/core';

import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { CartService } from '@core/services/cart.service';
import { DreamCanvasService } from '@core/services/dream-canvas.service';
import { ShoppingContextService } from '@core/services/shopping-context.service';
import { SeoService } from '@core/services/seo.service';
import { PublishedCatalogSyncService } from '@core/services/published-catalog-sync.service';
import { AdminAuthService } from '@core/services/admin-auth.service';
import { productAttributeTemplate } from '@shared/utils/product-attribute-template';
import {
  formatIrr,
  productIdToNumber
} from '@core/services/search.service';
import {
  BridalCollectionCategory,
  BridalSampleProduct,
  complementaryProductsFor,
  ProductSizeOption,
  ProductVariationOption,
  SHOE_CATEGORY_SLUG,
  SNEAKER_CATEGORY_SLUG,
  getBridalCategoryBySlug,
  getBridalProductById,
  getBridalPreviewProductById,
  getSizeOptionsForProduct,
  getVariationOptionsForProduct,
  isConsultationCategory,
  isFootwearCategory,
  productsForCategory
} from '@shared/data/bridal-collection-categories';
import { findCategoryForSubSlug, getCatalogCategoryBySlug, CatalogCategory, CatalogSubcategory } from '@shared/data/catalog-categories';
import { RecommendationWidgetComponent } from '@shared/components/recommendation-widget/recommendation-widget.component';
import { ResponsiveProductImageDirective } from '@shared/directives/responsive-product-image.directive';
import { JalaliDateInputComponent } from '@shared/components/jalali-date-input/jalali-date-input.component';
import { HomeTrialService } from '@core/services/home-trial.service';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [FormsModule, RouterLink, RecommendationWidgetComponent, ResponsiveProductImageDirective, JalaliDateInputComponent],
  templateUrl: './product-detail.component.html',
  styleUrls: ['./product-detail.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProductDetailComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly cart = inject(CartService);
  private readonly dreamCanvas = inject(DreamCanvasService);
  private readonly shoppingContext = inject(ShoppingContextService);
  private readonly seo = inject(SeoService);
  readonly homeTrial = inject(HomeTrialService);
  homeTrialMessage = '';
  private readonly publishedSync = inject(PublishedCatalogSyncService);
  private readonly adminAuth = inject(AdminAuthService);
  private sub?: Subscription;
  private cartNoticeTimer?: ReturnType<typeof setTimeout>;
  private galleryTouchStartX = 0;

  product: BridalSampleProduct | null = null;
  category: BridalCollectionCategory | null = null;
  shopParent: CatalogCategory | null = null;
  shopSub: CatalogSubcategory | null = null;
  backLink: string[] = ['/'];
  backLabel = 'بازگشت به صفحه اصلی';
  related: BridalSampleProduct[] = [];
  suggested: BridalSampleProduct[] = [];
  activeImage = '';
  price = 0;
  priceLabel = '';
  originalPrice = 0;
  originalPriceLabel = '';
  discountPercent = 0;
  productIdNumber = 0;
  onDreamBoard = false;
  readonly adminUser = this.adminAuth.user;

  canEditProduct(): boolean {
    return this.adminAuth.hasPermission('publishing.published.manage');
  }

  showConsultation = false;
  isFootwear = false;
  isShoes = false;
  isSneakers = false;
  isBridalDress = false;
  isVeil = false;
  metaPrimaryLabel = 'فرم لباس';
  metaPrimaryValue = '';
  metaSecondaryLabel = 'پارچه';
  metaSecondaryValue = '';
  sizeOptions: ProductSizeOption[] = [];
  selectedSize = '';
  selectedStock = 0;
  sizeError = '';
  variationOptions: ProductVariationOption[] = [];
  selectedVariationId = '';
  selectedVariationLabel = '';
  variationError = '';
  selectedModelIndex = -1;
  modelSelectionError = '';
  engravingRequested = false;
  engravingText = '';
  engravingError = '';
  readonly engravingFee = 8_000_000;
  veilPrintRequested = false;
  veilPrintText = '';
  veilPrintError = '';
  readonly veilPrintFee = 10_000_000;
  cartNoticeVisible = false;
  descriptionExpanded = false;
  rentalSelected = false;
  ceremonyDate = '';
  rentalError = '';
  readonly rentalCategorySlugs = new Set([
    'bridal-tiaras', 'bridal-headbands', 'imported-hairpiece',
    'chignon-pins', 'bridal-capes'
  ]);

  constructor() {
    effect(() => {
      const version = this.publishedSync.version();
      if (!version) return;
      const routeId = this.route.snapshot.paramMap.get('id')?.trim() || '';
      const fresh = getBridalProductById(this.product?.id || routeId);
      if (!fresh) return;
      if (!this.product) {
        this.hydrateProductAfterSync(fresh);
        return;
      }
      this.product = fresh;
      this.applyCategoryPresentation(fresh);
      this.cdr.markForCheck();
    });
  }

  ngOnInit(): void {
    this.sub = this.route.paramMap.subscribe(params => {
      const id = params.get('id')?.trim() || '';
      const preview = this.route.snapshot.queryParamMap.get('preview') === '1';
      const found = id
        ? (preview ? getBridalPreviewProductById(id) : getBridalProductById(id))
        : undefined;

      if (!found) {
        return;
      }

      this.product = found;
      this.category = getBridalCategoryBySlug(found.categorySlug) ?? null;
      this.shopParent = null;
      this.shopSub = null;

      const shopMatch = findCategoryForSubSlug(found.categorySlug);
      if (this.category) {
        this.backLink = ['/collections', this.category.slug];
        this.backLabel = 'بازگشت به کالکشن';
      } else if (shopMatch) {
        this.shopParent = shopMatch.category;
        this.shopSub = shopMatch.sub;
        this.backLink = ['/shop', shopMatch.category.slug, shopMatch.sub.slug];
        this.backLabel = `بازگشت به ${shopMatch.sub.label}`;
      } else {
        const parentCat = getCatalogCategoryBySlug(found.categorySlug);
        if (parentCat) {
          this.shopParent = parentCat;
          this.backLink = ['/shop', parentCat.slug];
          this.backLabel = `بازگشت به ${parentCat.title}`;
        } else {
          this.backLink = ['/'];
          this.backLabel = 'بازگشت به صفحه اصلی';
        }
      }

      this.applyCategoryPresentation(found);
      this.activeImage = found.gallery?.[0] || found.image;
      this.related = productsForCategory(found.categorySlug)
        .filter(p => p.id !== found.id && p.variantKey !== found.variantKey)
        .slice(0, 4);
      this.suggested = complementaryProductsFor(found, 8);
      this.engravingRequested = false;
      this.engravingText = '';
      this.engravingError = '';
      this.veilPrintRequested = false;
      this.veilPrintText = '';
      this.veilPrintError = '';
      this.rentalSelected = false;
      this.ceremonyDate = '';
      this.rentalError = '';
      this.selectedModelIndex = -1;
      this.modelSelectionError = '';
      this.descriptionExpanded = false;
      this.applyPrice(found);
      this.productIdNumber = productIdToNumber(found.id);
      this.onDreamBoard = this.dreamCanvas.has(this.productIdNumber);
      this.shoppingContext.rememberPath(
        this.shoppingContext.linkForCategorySlug(found.categorySlug)
      );
      this.seo.applyProductSeo({
        metaTitle: `${found.name} | گالری مظهری`,
        metaDescription: `${found.name} از مجموعه عروس گالری مظهری — مشاهده جزئیات و تکمیل استایل.`,
        canonical: `https://gallerymazhari.com/product/${encodeURIComponent(found.id)}`,
        altTexts: { primary: `${found.name} — گالری مظهری` },
        openGraph: {
          title: `${found.name} | گالری مظهری`,
          description: `${found.name} از مجموعه عروس گالری مظهری`,
          image: found.image || null
        },
        jsonLd: {
          '@context': 'https://schema.org',
          '@type': 'Product',
          name: found.name,
          sku: found.id,
          image: found.image ? [found.image] : undefined,
          brand: { '@type': 'Brand', name: 'گالری مظهری' },
          url: `https://gallerymazhari.com/product/${encodeURIComponent(found.id)}`
        }
      }, found.name);
      this.cdr.markForCheck();
    });
  }

  private hydrateProductAfterSync(found: BridalSampleProduct): void {
    this.product = found;
    this.category = getBridalCategoryBySlug(found.categorySlug) ?? null;
    const shopMatch = findCategoryForSubSlug(found.categorySlug);
    this.shopParent = shopMatch?.category ?? getCatalogCategoryBySlug(found.categorySlug) ?? null;
    this.shopSub = shopMatch?.sub ?? null;
    if (this.category) {
      this.backLink = ['/collections', this.category.slug];
      this.backLabel = 'بازگشت به کالکشن';
    } else if (shopMatch) {
      this.backLink = ['/shop', shopMatch.category.slug, shopMatch.sub.slug];
      this.backLabel = `بازگشت به ${shopMatch.sub.label}`;
    } else {
      this.backLink = ['/'];
      this.backLabel = 'بازگشت به صفحه اصلی';
    }
    this.applyCategoryPresentation(found);
    this.activeImage = found.gallery?.[0] || found.image;
    this.related = productsForCategory(found.categorySlug)
      .filter(product => product.id !== found.id && product.variantKey !== found.variantKey)
      .slice(0, 4);
    this.suggested = complementaryProductsFor(found, 8);
    this.applyPrice(found);
    this.productIdNumber = productIdToNumber(found.id);
    this.onDreamBoard = this.dreamCanvas.has(this.productIdNumber);
    this.cdr.markForCheck();
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
    if (this.cartNoticeTimer) {
      clearTimeout(this.cartNoticeTimer);
    }
  }

  private applyCategoryPresentation(product: BridalSampleProduct): void {
    const slug = product.categorySlug;
    const attributeTemplate = productAttributeTemplate(slug);
    this.showConsultation = isConsultationCategory(slug);
    this.isFootwear = isFootwearCategory(slug);
    this.isShoes = slug === SHOE_CATEGORY_SLUG;
    this.isSneakers = slug === SNEAKER_CATEGORY_SLUG;
    this.isBridalDress = new Set([
      'bridal-clothing',
      'european-bridal-dresses',
      'arabic-bridal-dresses',
      'mermaid-bridal-dresses',
      'engagement-dresses'
    ]).has(slug);
    this.isVeil = slug === 'arabic-bridal-veils' || slug === 'european-bridal-veils';
    this.sizeError = '';

    if (this.isShoes) {
      this.metaPrimaryLabel = 'ارتفاع پاشنه';
      this.metaPrimaryValue = normalizedFootwearHeight(
        product.heelHeight || product.silhouette,
        product.name
      );
      this.metaSecondaryLabel = 'جنس رویه';
      this.metaSecondaryValue = product.material || product.fabric || '—';
    } else if (this.isSneakers) {
      this.metaPrimaryLabel = 'ارتفاع لژ';
      this.metaPrimaryValue = normalizedFootwearHeight(
        product.platformHeight || product.silhouette,
        product.name
      );
      this.metaSecondaryLabel = 'جنس رویه';
      this.metaSecondaryValue = product.material || product.fabric || '—';
    } else {
      this.metaPrimaryLabel = attributeTemplate.primary;
      this.metaPrimaryValue = product.primaryAttributeValue || product.silhouette || '—';
      this.metaSecondaryLabel = attributeTemplate.secondary;
      this.metaSecondaryValue = product.secondaryAttributeValue || product.material || product.fabric || '—';
    }

    this.metaPrimaryLabel = attributeTemplate.primary;
    this.metaPrimaryValue = this.isFootwear
      ? normalizedFootwearHeight(product.primaryAttributeValue || this.metaPrimaryValue, product.name)
      : product.primaryAttributeValue || this.metaPrimaryValue;
    this.metaSecondaryLabel = attributeTemplate.secondary;
    this.metaSecondaryValue = product.secondaryAttributeValue || this.metaSecondaryValue;

    this.sizeOptions = getSizeOptionsForProduct(product);
    if (this.sizeOptions.length) {
      this.selectedSize = '';
      this.selectedStock = 0;
    } else {
      this.selectedSize = product.size || '';
      this.selectedStock = product.stock ?? 0;
    }
    this.variationOptions = getVariationOptionsForProduct(product);
    this.selectedVariationId = '';
    this.selectedVariationLabel = '';
    this.variationError = '';
  }

  selectSize(option: ProductSizeOption): void {
    if (!option.available) {
      return;
    }
    this.selectedSize = option.size;
    this.selectedStock = option.stock;
    this.sizeError = '';
    const matched = getBridalProductById(option.productId);
    if (matched) {
      this.product = matched;
      this.productIdNumber = productIdToNumber(matched.id);
      this.applyPrice(matched);
      this.onDreamBoard = this.dreamCanvas.has(this.productIdNumber);
    }
    this.cdr.markForCheck();
  }

  selectVariation(productId: string): void {
    const option = this.variationOptions.find(item => item.productId === productId);
    if (!option?.available) return;
    this.selectedVariationId = productId;
    this.selectedVariationLabel = option.label;
    this.selectedSize = option.size || '';
    this.selectedStock = option.stock;
    this.variationError = '';
    this.sizeError = '';
    this.price = option.price ?? this.product?.price ?? 0;
    this.priceLabel = this.price > 0 ? formatIrr(this.price) : 'قیمت ثبت نشده';
    this.cdr.markForCheck();
  }

  visibleHighlights(product: BridalSampleProduct): string[] {
    if (!this.showConsultation) {
      return product.highlights;
    }
    return product.highlights.filter(item =>
      !/^\s*(موجودی|قیمت(?:\s*فروش)?)\s*[:：-]?/u.test(item)
    );
  }

  toggleDescription(): void {
    this.descriptionExpanded = !this.descriptionExpanded;
    this.cdr.markForCheck();
  }

  galleryImages(): string[] {
    if (!this.product) {
      return [];
    }
    const images = this.product.gallery?.length
      ? this.product.gallery
      : [this.product.image];
    return images;
  }

  selectImage(src: string): void {
    this.activeImage = src;
    if (this.requiresModelSelection) {
      this.selectedModelIndex = this.galleryImages().indexOf(src);
      this.modelSelectionError = '';
    }
    this.cdr.markForCheck();
  }

  changeGalleryImage(direction: -1 | 1): void {
    const images = this.galleryImages();
    if (images.length < 2) return;
    const current = Math.max(0, images.indexOf(this.activeImage));
    const next = (current + direction + images.length) % images.length;
    this.selectImage(images[next]);
  }

  onGalleryTouchStart(event: TouchEvent): void {
    this.galleryTouchStartX = event.changedTouches[0]?.clientX ?? 0;
  }

  onGalleryTouchEnd(event: TouchEvent): void {
    const endX = event.changedTouches[0]?.clientX ?? this.galleryTouchStartX;
    const delta = endX - this.galleryTouchStartX;
    if (Math.abs(delta) < 38) return;
    this.changeGalleryImage(delta > 0 ? -1 : 1);
  }

  hideBrokenImage(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.style.visibility = 'hidden';
  }

  addToCart(): void {
    if (!this.product) {
      return;
    }
    if (this.rentalSelected && !this.validateRentalDate()) {
      this.cdr.markForCheck();
      return;
    }
    if (this.variationOptions.length && !this.selectedVariationId) {
      this.variationError = 'لطفاً رنگ و سایز موردنظر را انتخاب کنید.';
      this.cdr.markForCheck();
      return;
    }
    if (this.requiresModelSelection && this.selectedModelIndex < 0) {
      this.modelSelectionError = 'لطفاً عکس مدل موردنظر را انتخاب کنید.';
      this.cdr.markForCheck();
      return;
    }
    if (this.isFootwear && !this.variationOptions.length && this.sizeOptions.length && !this.selectedSize) {
      this.sizeError = 'لطفاً سایز را انتخاب کنید.';
      this.cdr.markForCheck();
      return;
    }
    if (this.isFootwear && this.selectedStock <= 0) {
      this.sizeError = 'این سایز موجود نیست.';
      this.cdr.markForCheck();
      return;
    }
    if (this.isShoes && this.engravingRequested && !this.engravingText.trim()) {
      this.engravingError = 'متن حکاکی سفارشی را وارد کنید.';
      this.cdr.markForCheck();
      return;
    }
    if (this.isVeil && this.veilPrintRequested && !this.veilPrintText.trim()) {
      this.veilPrintError = 'اسم، تاریخ یا توضیحات چاپ اختصاصی را وارد کنید.';
      this.cdr.markForCheck();
      return;
    }

    const attributes: Array<{ name: string; value: string }> = [
      { name: 'کد مدل', value: this.product.id },
      {
        name: 'دسته',
        value: this.shopSub?.label || this.category?.title || this.shopParent?.title || this.product.categorySlug
      }
    ];
    if (this.selectedStock > 0) {
      attributes.push({ name: 'موجودی', value: String(this.selectedStock) });
    }
    if (this.selectedSize) {
      attributes.push({ name: 'سایز', value: this.selectedSize });
    }
    if (this.selectedVariationLabel) {
      attributes.push({ name: 'متغیر انتخاب‌شده', value: this.selectedVariationLabel });
      const selected = this.variationOptions.find(option => option.productId === this.selectedVariationId);
      if (selected?.color) attributes.push({ name: 'رنگ', value: selected.color });
      if (selected?.sku) attributes.push({ name: 'کد تنوع', value: selected.sku });
    }
    if (this.requiresModelSelection) {
      attributes.push(
        { name: 'مدل تصویری انتخاب‌شده', value: `مدل شماره ${this.selectedModelIndex + 1}` },
        { name: 'تصویر مدل', value: this.activeImage }
      );
    }
    if (this.metaPrimaryValue && this.metaPrimaryValue !== '—') {
      attributes.push({ name: this.metaPrimaryLabel, value: this.metaPrimaryValue });
    }
    if (this.metaSecondaryValue && this.metaSecondaryValue !== '—') {
      attributes.push({ name: this.metaSecondaryLabel, value: this.metaSecondaryValue });
    }
    const hasEngraving = this.isShoes && this.engravingRequested;
    const hasVeilPrint = this.isVeil && this.veilPrintRequested;
    if (hasEngraving) {
      attributes.push(
        { name: 'حکاکی سفارشی', value: this.engravingText.trim() },
        { name: 'زمان آماده‌سازی', value: '۲ روز بیشتر' }
      );
    }
    if (hasVeilPrint) {
      attributes.push(
        { name: 'چاپ اسم و تاریخ اختصاصی', value: this.veilPrintText.trim() },
        { name: 'هماهنگی سفارش', value: 'تماس همکاران گالری با مشتری' }
      );
    }
    if (this.rentalSelected) {
      attributes.push(
        { name: 'نوع سفارش', value: 'اجاره با ودیعه کامل' },
        { name: 'rentalCeremonyIso', value: this.ceremonyDate },
        { name: 'تاریخ مراسم', value: this.persianDate(this.ceremonyDate) },
        { name: 'مهلت بازگشت', value: this.persianDate(this.rentalReturnDate()) },
        { name: 'ودیعه پرداختی', value: formatIrr(this.price) },
        { name: 'مبلغ قابل بازگشت', value: formatIrr(this.rentalRefundAmount) },
        { name: 'بهای نهایی اجاره', value: formatIrr(this.rentalFee) }
      );
    }

    this.cart.addProductToCart(
      this.productIdNumber,
      1,
      this.price +
        (hasEngraving ? this.engravingFee : 0) +
        (hasVeilPrint ? this.veilPrintFee : 0),
      this.product.name,
      this.requiresModelSelection ? this.activeImage : this.product.image,
      {
        categorySlug: this.product.categorySlug,
        sourceId: this.variationOptions.find(option => option.productId === this.selectedVariationId)?.sku ||
          (('code' in this.product && typeof this.product.code === 'string')
            ? this.product.code
            : this.product.id),
        attributes: attributes.length ? attributes : undefined,
        engraving: (hasEngraving || hasVeilPrint) ? {
          product_id: this.productIdNumber,
          type: 'custom',
          text: hasVeilPrint ? this.veilPrintText.trim() : this.engravingText.trim(),
          position: hasVeilPrint ? 'veil-print' : 'custom',
          price_adjustment: hasVeilPrint ? this.veilPrintFee : this.engravingFee,
          notes: hasVeilPrint
            ? 'همکاران ما جهت هماهنگی بیشتر با مشتری تماس می‌گیرند.'
            : 'زمان ارسال ۲ روز اضافه می‌شود.'
        } : undefined
      }
    );
    this.showCartNotice();
  }

  addToHomeTrial(): void {
    if (!this.product) return;
    if (this.variationOptions.length && !this.selectedVariationId) {
      this.variationError = 'برای تست در محل هم باید رنگ یا سایز موردنظر را انتخاب کنید.';
      this.homeTrialMessage = '';
      return;
    }
    if (this.isFootwear && !this.variationOptions.length && this.sizeOptions.length && !this.selectedSize) {
      this.sizeError = 'برای تست در محل ابتدا سایز را انتخاب کنید.';
      this.homeTrialMessage = '';
      return;
    }
    if (this.requiresModelSelection && this.selectedModelIndex < 0) {
      this.modelSelectionError = 'برای تست در محل ابتدا عکس مدل موردنظر را انتخاب کنید.';
      this.homeTrialMessage = '';
      return;
    }
    const option = this.variationOptions.find(item => item.productId === this.selectedVariationId);
    const selectionLabel = [option?.label, this.requiresModelSelection ? `مدل ${this.selectedModelIndex + 1}` : ''].filter(Boolean).join(' · ');
    const selectedProduct: BridalSampleProduct = {
      ...this.product,
      id: `${this.product.id}::${option?.sku || this.selectedSize || 'base'}::${this.requiresModelSelection ? this.selectedModelIndex + 1 : 0}`,
      name: selectionLabel ? `${this.product.name} — ${selectionLabel}` : this.product.name,
      image: this.requiresModelSelection ? this.activeImage : this.product.image,
      size: option?.size || this.selectedSize || this.product.size,
      color: option?.color || this.product.color
    };
    this.homeTrialMessage = this.homeTrial.add(selectedProduct) || 'به انتخاب‌های تست در محل اضافه شد.';
  }

  get requiresModelSelection(): boolean {
    return !!this.product && (this.product.modelSelectionEnabled || this.product.categorySlug === 'chignon-pins') && this.galleryImages().length > 1;
  }

  get hasMultipleVariationColors(): boolean {
    return new Set(this.variationOptions.map(option => (option.color || '').trim().toLocaleLowerCase('fa')).filter(Boolean)).size > 1;
  }

  get variationSelectorTitle(): string {
    const hasSize = this.variationOptions.some(option => !!option.size);
    return this.hasMultipleVariationColors ? (hasSize ? 'انتخاب رنگ و سایز' : 'انتخاب رنگ') : (hasSize ? 'انتخاب سایز' : 'انتخاب مدل');
  }

  get canRent(): boolean {
    return !!this.product && this.rentalCategorySlugs.has(this.product.categorySlug) && this.price > 0;
  }

  get rentalFee(): number { return Math.round(this.price / 2); }
  get rentalRefundAmount(): number { return this.price - this.rentalFee; }
  get rentalFeeLabel(): string { return formatIrr(this.rentalFee); }
  get rentalRefundLabel(): string { return formatIrr(this.rentalRefundAmount); }

  get rentalMinDate(): string { return this.dateInputValue(new Date()); }

  get rentalMaxCeremonyDate(): string {
    const date = new Date();
    date.setDate(date.getDate() + 38);
    return this.dateInputValue(date);
  }

  selectPurchaseMode(rental: boolean): void {
    this.rentalSelected = rental;
    this.rentalError = '';
  }

  rentalReturnDate(): string {
    if (!this.ceremonyDate) return '';
    const date = new Date(`${this.ceremonyDate}T12:00:00`);
    date.setDate(date.getDate() + 7);
    return this.dateInputValue(date);
  }

  private validateRentalDate(): boolean {
    if (!this.ceremonyDate) {
      this.rentalError = 'لطفاً تاریخ مراسم را انتخاب کنید.';
      return false;
    }
    const ceremony = new Date(`${this.ceremonyDate}T12:00:00`).getTime();
    const min = new Date(`${this.rentalMinDate}T00:00:00`).getTime();
    const max = new Date(`${this.rentalMaxCeremonyDate}T23:59:59`).getTime();
    if (!Number.isFinite(ceremony) || ceremony < min || ceremony > max) {
      this.rentalError = 'تاریخ مراسم باید طوری باشد که بازگشت کالا حداکثر تا ۴۵ روز پس از امروز انجام شود.';
      return false;
    }
    this.rentalError = '';
    return true;
  }

  private applyPrice(product: BridalSampleProduct): void {
    this.price = product.salePrice ?? product.price ?? 0;
    this.originalPrice = product.originalPrice ?? 0;
    this.discountPercent = product.discountPercent ?? 0;
    this.priceLabel = this.price > 0 ? formatIrr(this.price) : 'قیمت ثبت نشده';
    this.originalPriceLabel = this.originalPrice > this.price ? formatIrr(this.originalPrice) : '';
  }

  private dateInputValue(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  persianDate(value: string): string {
    if (!value) return '—';
    return new Intl.DateTimeFormat('fa-IR', { year: 'numeric', month: 'long', day: 'numeric' })
      .format(new Date(`${value}T12:00:00`));
  }

  closeCartNotice(): void {
    this.cartNoticeVisible = false;
    if (this.cartNoticeTimer) {
      clearTimeout(this.cartNoticeTimer);
      this.cartNoticeTimer = undefined;
    }
    this.cdr.markForCheck();
  }

  private showCartNotice(): void {
    if (this.cartNoticeTimer) {
      clearTimeout(this.cartNoticeTimer);
    }
    this.cartNoticeVisible = true;
    this.cartNoticeTimer = setTimeout(() => {
      this.cartNoticeVisible = false;
      this.cartNoticeTimer = undefined;
      this.cdr.markForCheck();
    }, 4500);
    this.cdr.markForCheck();
  }

  addToDreamBoard(): void {
    if (!this.product) {
      return;
    }
    if (this.dreamCanvas.has(this.productIdNumber)) {
      this.dreamCanvas.remove(this.productIdNumber);
      this.onDreamBoard = false;
      this.cdr.markForCheck();
      return;
    }
    const added = this.dreamCanvas.add({
      productId: this.productIdNumber,
      name: this.product.name,
      image: this.product.image,
      price: this.priceLabel,
      slug: this.product.id
    });
    this.onDreamBoard = added;
    this.cdr.markForCheck();
  }
}

function normalizedFootwearHeight(value: string | undefined, productName: string): string {
  const clean = (value || '').trim();
  if (clean && !clean.includes('?') && !clean.includes('�')) {
    return clean;
  }
  const model = productName.trim().split(/\s+/)[0] || '';
  const match = /-(\d+(?:[.,]\d+)?)$/.exec(model);
  return match ? `${match[1].replace(',', '.')} سانتی‌متر` : '—';
}
