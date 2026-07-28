/** Enterprise admin domain models — Gallery Mazhari Ops Console */

export type BridalOrderStage =
  | 'new'
  | 'fitting'
  | 'tailoring'
  | 'ready'
  | 'delivered';

export type PaymentStatus = 'paid' | 'partial' | 'pending' | 'refunded';

export interface BridalOrderLine {
  productCode: string;
  name: string;
  qty: number;
  unitPrice: number;
}

export interface BridalShippingAddress {
  fullName: string;
  phone: string;
  address: string;
  city: string;
  postalCode: string;
}

/** آدرس ثابت فرستنده برای لیبل ارسال گالری مظهری */
export const GALLERY_SENDER_ADDRESS =
  'تهران ، چهارراه مخبرالدوله ، کوچه رفاهی ، پلاک ۱۶ - کد پستی ۱۱۴۴۷۴۵۱۱۹ - شماره تماس ۰۹۳۸۹۰۰۲۹۸۶';

export interface BridalOrder {
  id: string;
  orderNo: string;
  customerName: string;
  customerPhone: string;
  customerId: string;
  stage: BridalOrderStage;
  paymentStatus: PaymentStatus;
  total: number;
  paidAmount: number;
  ceremonyDate?: string;
  notes?: string;
  lines: BridalOrderLine[];
  createdAt: string;
  updatedAt: string;
  assignee?: string;
  /** آدرس گیرنده از چک‌اوت فروشگاه */
  shippingAddress?: BridalShippingAddress;
  sourceOrderId?: string;
}

export interface CrmClient {
  id: string;
  name: string;
  phone: string;
  email: string;
  city: string;
  ltv: number;
  ordersCount: number;
  lastVisitAt: string;
  ceremonyDate?: string;
  tags: string[];
  dreamBoard: Array<{ id: string; name: string; image: string; price: number }>;
  appointments: Array<{ id: string; title: string; at: string; status: string }>;
}

export interface InventorySku {
  id: string;
  code: string;
  name: string;
  category: string;
  parentCategorySlug?: string;
  categorySlug?: string;
  price: number;
  stock: number;
  status: 'active' | 'draft' | 'out_of_stock' | 'internal';
  hasPhoto: boolean;
  photoUrl?: string;
  onSale?: boolean;
  discountPercent?: number;
}

export interface PromoCode {
  id: string;
  code: string;
  type: 'percent' | 'fixed';
  value: number;
  startsAt: string;
  endsAt: string;
  usageLimit: number;
  usedCount: number;
  active: boolean;
  note?: string;
}

export interface AbandonedCart {
  id: string;
  customerName: string;
  phone: string;
  itemsCount: number;
  cartTotal: number;
  lastActiveAt: string;
  channelHint: 'sms' | 'telegram';
  itemsPreview: string[];
}

export interface AnalyticsPoint {
  label: string;
  value: number;
}

export interface AnalyticsSnapshot {
  todayVisits: number;
  pendingConsultations: number;
  lowStockAlerts: number;
  monthlyRevenue: number;
  conversionRate: number;
  revenueSeries: AnalyticsPoint[];
  salesByCategory: AnalyticsPoint[];
  conversionSeries: AnalyticsPoint[];
}

export interface LiveFeedItem {
  id: string;
  kind: 'consultation' | 'dream' | 'order' | 'visit' | 'staff';
  summary: string;
  actor: string;
  at: string;
}

export const ORDER_STAGE_LABELS: Record<BridalOrderStage, string> = {
  new: 'سفارش جدید',
  fitting: 'رزرو پرو',
  tailoring: 'در حال دوخت/آماده‌سازی',
  ready: 'آماده تحویل',
  delivered: 'تحویل‌شده'
};

export const ORDER_STAGES: BridalOrderStage[] = [
  'new',
  'fitting',
  'tailoring',
  'ready',
  'delivered'
];
