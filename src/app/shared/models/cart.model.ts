/**
 * Cart Models
 * Shopping cart items and checkout
 */

import { EngravingRequest } from './engraving.model';
import { MetaData } from './common.model';

export interface CartItem {
  id?: string;
  product_id: number;
  product_name?: string;
  product_image?: string;
  /** Catalog subcategory / collection slug for contextual continue-shopping. */
  category_slug?: string;
  /** Original string product id (e.g. d-01, m-003). */
  source_id?: string;
  quantity: number;
  price: number;
  regular_price?: number;
  sale_price?: number;
  subtotal?: number;
  tax?: number;
  total?: number;
  attributes?: CartItemAttribute[];
  engraving?: EngravingRequest;
  added_at?: string;
}

export interface CartItemAttribute {
  name: string;
  value: string;
}

export interface Cart {
  items: CartItem[];
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
  item_count: number;
  coupon?: string;
  coupon_discount?: number;
  updated_at: string;
}

export interface Checkout {
  billing: Address;
  shipping: Address;
  payment_method: string;
  payment_method_title: string;
  customer_note: string;
  order_comments: string;
}

export interface Address {
  first_name: string;
  last_name: string;
  company: string;
  address_1: string;
  address_2: string;
  city: string;
  state: string;
  postcode: string;
  country: string;
  email: string;
  phone: string;
}

export interface Order {
  id: number;
  parent_id: number;
  number: string;
  order_key: string;
  created_via: string;
  version: string;
  status: 'pending' | 'processing' | 'on-hold' | 'completed' | 'cancelled' | 'refunded' | 'failed';
  currency: string;
  date_created: string;
  date_created_gmt: string;
  date_modified: string;
  date_modified_gmt: string;
  discount_total: string;
  discount_tax: string;
  shipping_total: string;
  shipping_tax: string;
  cart_tax: string;
  total: string;
  total_tax: string;
  customer_id: number;
  customer_ip_address: string;
  customer_user_agent: string;
  customer_note: string;
  billing: Address;
  shipping: Address;
  payment_method: string;
  payment_method_title: string;
  transaction_id: string;
  date_paid: string;
  date_paid_gmt: string;
  date_completed: string;
  date_completed_gmt: string;
  cart_hash: string;
  meta_data: MetaData[];
  line_items: OrderLineItem[];
  tax_lines: TaxLine[];
  shipping_lines: ShippingLine[];
  fee_lines: FeeLine[];
  coupon_lines: CouponLine[];
  refunds: Refund[];
  currency_symbol: string;
}

export interface OrderLineItem {
  id: number;
  name: string;
  product_id: number;
  variation_id: number;
  quantity: number;
  tax_class: string;
  subtotal: string;
  subtotal_tax: string;
  total: string;
  total_tax: string;
  taxes: TaxData[];
  meta_data: MetaData[];
  sku: string;
  price: string;
  image?: string;
}

export interface TaxLine {
  id: number;
  rate_code: string;
  rate_id: string;
  label: string;
  compound: boolean;
  tax_total: string;
  shipping_tax_total: string;
  meta_data: MetaData[];
}

export interface ShippingLine {
  id: number;
  method_title: string;
  method_id: string;
  total: string;
  total_tax: string;
  taxes: TaxData[];
  meta_data: MetaData[];
}

export interface FeeLine {
  id: number;
  name: string;
  tax_class: string;
  tax_status: string;
  total: string;
  total_tax: string;
  taxes: TaxData[];
  meta_data: MetaData[];
}

export interface CouponLine {
  id: number;
  code: string;
  discount: string;
  discount_tax: string;
  meta_data: MetaData[];
}

export interface Refund {
  id: number;
  reason: string;
  total: string;
  meta_data: MetaData[];
  line_items: OrderLineItem[];
  date_created: string;
  date_created_gmt: string;
}

export interface TaxData {
  id: string;
  total: string;
  subtotal: string;
}

export interface OrderFilter {
  page?: number;
  per_page?: number;
  search?: string;
  after?: string;
  before?: string;
  exclude?: number[];
  include?: number[];
  offset?: number;
  order?: 'asc' | 'desc';
  orderby?: 'date' | 'id' | 'include' | 'title';
  parent?: number;
  parent_exclude?: number[];
  status?: string[];
  customer?: number;
  product?: number;
  dp?: number;
}
