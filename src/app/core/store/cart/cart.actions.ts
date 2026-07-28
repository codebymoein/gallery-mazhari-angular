/**
 * Cart Store Actions
 * Actions for cart state management
 */

import { createAction, props } from '@ngrx/store';
import { CartItem } from '@shared/models';

// Add to Cart
export const addToCart = createAction(
  '[Cart] Add Item',
  props<{ item: CartItem }>()
);

export const addToCartSuccess = createAction(
  '[Cart] Add Item Success',
  props<{ item: CartItem }>()
);

export const addToCartError = createAction(
  '[Cart] Add Item Error',
  props<{ error: string }>()
);

// Remove from Cart
export const removeFromCart = createAction(
  '[Cart] Remove Item',
  props<{ productId: number }>()
);

export const removeFromCartSuccess = createAction(
  '[Cart] Remove Item Success',
  props<{ productId: number }>()
);

export const removeFromCartError = createAction(
  '[Cart] Remove Item Error',
  props<{ error: string }>()
);

// Update Quantity
export const updateCartItemQuantity = createAction(
  '[Cart] Update Item Quantity',
  props<{ productId: number; quantity: number }>()
);

export const updateCartItemQuantitySuccess = createAction(
  '[Cart] Update Item Quantity Success',
  props<{ productId: number; quantity: number }>()
);

export const updateCartItemQuantityError = createAction(
  '[Cart] Update Item Quantity Error',
  props<{ error: string }>()
);

// Clear Cart
export const clearCart = createAction(
  '[Cart] Clear Cart'
);

export const clearCartSuccess = createAction(
  '[Cart] Clear Cart Success'
);

export const clearCartError = createAction(
  '[Cart] Clear Cart Error',
  props<{ error: string }>()
);

// Load Cart
export const loadCart = createAction(
  '[Cart] Load Cart'
);

export const loadCartSuccess = createAction(
  '[Cart] Load Cart Success',
  props<{ items: CartItem[] }>()
);

export const loadCartError = createAction(
  '[Cart] Load Cart Error',
  props<{ error: string }>()
);

// Apply Coupon
export const applyCoupon = createAction(
  '[Cart] Apply Coupon',
  props<{ coupon: string }>()
);

export const applyCouponSuccess = createAction(
  '[Cart] Apply Coupon Success',
  props<{ coupon: string; discount: number; percent: number }>()
);

export const applyCouponError = createAction(
  '[Cart] Apply Coupon Error',
  props<{ error: string }>()
);

// Remove Coupon
export const removeCoupon = createAction(
  '[Cart] Remove Coupon'
);

export const removeCouponSuccess = createAction(
  '[Cart] Remove Coupon Success'
);

export const removeCouponError = createAction(
  '[Cart] Remove Coupon Error',
  props<{ error: string }>()
);

// Calculate Totals
export const calculateTotals = createAction(
  '[Cart] Calculate Totals'
);

export const calculateTotalsSuccess = createAction(
  '[Cart] Calculate Totals Success',
  props<{ subtotal: number; tax: number; shipping: number; total: number }>()
);

// Sync Cart
export const syncCart = createAction(
  '[Cart] Sync Cart'
);
