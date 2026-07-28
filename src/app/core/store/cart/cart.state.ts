/**
 * Cart Store State
 * Manages shopping cart and checkout
 */

import { CartItem } from '@shared/models';

export interface CartState {
  items: CartItem[];
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
  itemCount: number;
  coupon?: string;
  /** مبلغ تخفیف به تومان */
  couponDiscount?: number;
  /** درصد تخفیف برای نمایش در چک‌اوت */
  couponPercent?: number;
  loading: boolean;
  error: string | null;
  lastUpdated: string | null;
}

export const initialCartState: CartState = {
  items: [],
  subtotal: 0,
  tax: 0,
  shipping: 0,
  total: 0,
  itemCount: 0,
  coupon: undefined,
  couponDiscount: 0,
  couponPercent: 0,
  loading: false,
  error: null,
  lastUpdated: null
};
