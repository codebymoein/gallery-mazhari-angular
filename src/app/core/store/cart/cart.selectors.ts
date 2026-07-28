/**
 * Cart Store Selectors
 * Memoized selectors for cart state queries
 */

import { createFeatureSelector, createSelector } from '@ngrx/store';
import { CartState } from './cart.state';

export const selectCartState = createFeatureSelector<CartState>('cart');

// Items
export const selectCartItems = createSelector(
  selectCartState,
  (state: CartState) => state.items
);

export const selectCartItemCount = createSelector(
  selectCartState,
  (state: CartState) => state.itemCount
);

export const selectCartItemByProductId = (productId: number) =>
  createSelector(
    selectCartItems,
    (items) => items.find(i => i.product_id === productId) || null
  );

// Totals
export const selectSubtotal = createSelector(
  selectCartState,
  (state: CartState) => state.subtotal
);

export const selectTax = createSelector(
  selectCartState,
  (state: CartState) => state.tax
);

export const selectShipping = createSelector(
  selectCartState,
  (state: CartState) => state.shipping
);

export const selectTotal = createSelector(
  selectCartState,
  (state: CartState) => state.total
);

export const selectCartTotals = createSelector(
  selectSubtotal,
  selectTax,
  selectShipping,
  selectTotal,
  (subtotal, tax, shipping, total) => ({
    subtotal,
    tax,
    shipping,
    total
  })
);

// Coupon
export const selectCoupon = createSelector(
  selectCartState,
  (state: CartState) => state.coupon
);

export const selectCouponDiscount = createSelector(
  selectCartState,
  (state: CartState) => state.couponDiscount
);

export const selectHasCoupon = createSelector(
  selectCoupon,
  (coupon) => !!coupon
);

// Loading & Error
export const selectCartLoading = createSelector(
  selectCartState,
  (state: CartState) => state.loading
);

export const selectCartError = createSelector(
  selectCartState,
  (state: CartState) => state.error
);

export const selectLastUpdated = createSelector(
  selectCartState,
  (state: CartState) => state.lastUpdated
);

// Computed
export const selectEmptyCart = createSelector(
  selectCartItems,
  (items) => items.length === 0
);

export const selectCouponPercent = createSelector(
  selectCartState,
  (state: CartState) => state.couponPercent || 0
);

export const selectCartSummary = createSelector(
  selectCartItems,
  selectCartTotals,
  selectCoupon,
  selectCouponDiscount,
  selectCouponPercent,
  selectCartItemCount,
  (items, totals, coupon, couponDiscount, couponPercent, itemCount) => ({
    itemCount,
    items: items.length,
    subtotal: totals.subtotal,
    tax: totals.tax,
    shipping: totals.shipping,
    coupon: coupon || '',
    couponDiscount: couponDiscount || 0,
    couponPercent: couponPercent || 0,
    total: Math.max(0, totals.total - (couponDiscount || 0))
  })
);

export const selectCartValue = createSelector(
  selectTotal,
  selectCouponDiscount,
  (total, discount) => total - (discount || 0)
);

// Cart Item Stats
export const selectCartStats = createSelector(
  selectCartItems,
  selectSubtotal,
  selectTotal,
  (items, subtotal, total) => ({
    uniqueItems: items.length,
    totalItems: items.reduce((sum, i) => sum + i.quantity, 0),
    subtotal,
    total,
    averagePrice: items.length > 0 ? subtotal / items.length : 0
  })
);
