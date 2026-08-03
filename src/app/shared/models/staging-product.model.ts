/**
 * Staging / inventory pipeline models for the admin dashboard.
 */

export type AdminRole = 'staff' | 'manager';

export type StagingStatus =
  | 'waiting_photo'
  | 'ready_for_approval'
  | 'published'
  | 'awaiting_stock'
  | 'rejected';

export interface StagingPhoto {
  url: string;
  fileName: string;
  addedAt: string;
}

export interface StagingVariation {
  id?: string;
  sku: string;
  barcode: string;
  size?: string;
  color?: string;
  material?: string;
  price?: number;
  stock: number;
  available: boolean;
}

export interface StagingProduct {
  id: string;
  code: string;
  name: string;
  /** نمایش طبقه (زیردسته یا برچسب ویژه) */
  category: string;
  /** عنوان دسته اصلی سایت (مثلاً پوشاک عروس) */
  parentCategory: string;
  parentCategorySlug: string;
  categorySlug: string;
  stock: number;
  /** قیمت قطعی فروش از ستون فایل انبار، به ریال */
  price?: number;
  originalPrice?: number;
  salePrice?: number;
  discountPercent?: number;
  discountTitle?: string;
  discountBadge?: string;
  modelSelectionEnabled?: boolean;
  /** سایز از اکسل (متغیر محصول) */
  size?: string;
  color?: string;
  /** جنس رویه / متریال */
  material?: string;
  /** توضیح مختصر محصول، همگام‌شده از دیتابیس */
  description?: string;
  /** توضیحات کامل و تکمیلی محصول، همگام‌شده از دیتابیس */
  additionalDescription?: string;
  /** ارتفاع پاشنه — کفش */
  heelHeight?: string;
  /** ارتفاع لژ — کتونی */
  platformHeight?: string;
  /**
   * کلید گروه‌بندی سایزها: محصولات هم‌نام در یک زیردسته
   * به‌عنوان متغیرهای یک مدل در نظر گرفته می‌شوند.
   */
  variantKey?: string;
  variations?: StagingVariation[];
  /** تگ‌های داخلی مدیریت؛ تا زمان تعیین سیاست نمایش برای کاربر مخفی هستند. */
  hiddenTags?: string[];
  /** محصولی که نسبت به فایل اکسل قبلی جدید است */
  isNewImport?: boolean;
  status: StagingStatus;
  /** وضعیت محصول پیش از انتقال به زباله‌دان، برای بازگردانی دقیق */
  trashedFromStatus?: StagingStatus;
  /** Local fallback only: workflow state to restore when stock returns. */
  inventoryResumeStatus?: StagingStatus;
  photos: StagingPhoto[];
  /** سازگاری با UI قدیمی — همیشه برابر photos[0] */
  photoUrl?: string;
  photoFileName?: string;
  importedAt: string;
  processedAt?: string;
  publishedAt?: string;
  processedBy?: string;
  publishedBy?: string;
  internalOnly?: boolean;
  notes?: string;
}

export interface AdminSessionUser {
  username: string;
  displayName: string;
  role: AdminRole;
  accessToken?: string;
  backendUserRole?: 'admin' | 'staff' | 'customer';
  permissions?: string[];
}

export interface ExcelImportResult {
  fileName: string;
  totalRows: number;
  accepted: StagingProduct[];
  filtered: Array<{ code: string; name: string; reason: string }>;
  /** کدهایی که در این فایل ناموجود بودند و از چرخه حذف شدند */
  removedOutOfStock: string[];
  newProductCount: number;
  importedAt: string;
}

export interface ManagerMetrics {
  totalPending: number;
  waitingPhoto: number;
  readyForApproval: number;
  processedToday: number;
  activeOnSite: number;
}

export const STAGING_STATUS_LABELS: Record<StagingStatus, string> = {
  waiting_photo: 'در حال تکمیل عکس و تنظیمات',
  ready_for_approval: 'آماده‌ی تایید مدیر',
  published: 'منتشر شده روی سایت',
  awaiting_stock: 'منتشرشده؛ در انتظار موجودی',
  rejected: 'رد شده'
};

export const NEW_PRODUCT_CATEGORY_LABEL = 'محصول جدید وارد شده';
export const NEW_PRODUCT_CATEGORY_SLUG = 'new-arrivals';
export const MAX_STAGING_PHOTOS = 5;
