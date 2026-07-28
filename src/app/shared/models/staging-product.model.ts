/**
 * Staging / inventory pipeline models for the admin dashboard.
 */

export type AdminRole = 'staff' | 'manager';

export type StagingStatus =
  | 'waiting_photo'
  | 'ready_for_approval'
  | 'published'
  | 'rejected';

export interface StagingPhoto {
  url: string;
  fileName: string;
  addedAt: string;
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
  /** محصولی که نسبت به فایل اکسل قبلی جدید است */
  isNewImport?: boolean;
  status: StagingStatus;
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
  backendUserRole?: 'admin' | 'customer';
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
  waiting_photo: 'در انتظار عکاسی',
  ready_for_approval: 'آماده‌ی تایید مدیر',
  published: 'منتشر شده روی سایت',
  rejected: 'رد شده'
};

export const NEW_PRODUCT_CATEGORY_LABEL = 'محصول جدید وارد شده';
export const NEW_PRODUCT_CATEGORY_SLUG = 'new-arrivals';
export const MAX_STAGING_PHOTOS = 5;
