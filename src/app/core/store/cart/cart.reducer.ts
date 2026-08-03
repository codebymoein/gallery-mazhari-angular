/**
 * Cart Store Reducer
 * Pure functions to update cart state
 */

import { createReducer, on } from '@ngrx/store';
import { initialCartState } from './cart.state';
import * as CartActions from './cart.actions';

export const cartReducer = createReducer(
  initialCartState,

  // Add to Cart
  on(CartActions.addToCart, (state) => ({
    ...state,
    loading: true,
    error: null
  })),

  on(CartActions.addToCartSuccess, (state, { item }) => {
    const existingItem = state.items.find(i => i.product_id === item.product_id);
    let updatedItems: typeof state.items;

    if (existingItem) {
      updatedItems = state.items.map(i =>
        i.product_id === item.product_id
          ? {
              ...i,
              quantity: i.quantity + item.quantity,
              category_slug: item.category_slug || i.category_slug,
              source_id: item.source_id || i.source_id,
              product_name: item.product_name || i.product_name,
              product_image: item.product_image || i.product_image,
              price: item.price,
              regular_price: item.regular_price || i.regular_price,
              sale_price: item.sale_price || i.sale_price,
              attributes: item.attributes || i.attributes,
              engraving: item.engraving || i.engraving,
              added_at: item.added_at || i.added_at
            }
          : i
      );
    } else {
      updatedItems = [...state.items, item];
    }

    return {
      ...state,
      items: updatedItems,
      itemCount: updatedItems.reduce((sum, i) => sum + i.quantity, 0),
      loading: false,
      lastUpdated: new Date().toISOString()
    };
  }),

  on(CartActions.addToCartError, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),

  // Remove from Cart
  on(CartActions.removeFromCart, (state) => ({
    ...state,
    loading: true,
    error: null
  })),

  on(CartActions.removeFromCartSuccess, (state, { productId }) => {
    const updatedItems = state.items.filter(i => i.product_id !== productId);
    return {
      ...state,
      items: updatedItems,
      itemCount: updatedItems.reduce((sum, i) => sum + i.quantity, 0),
      loading: false,
      lastUpdated: new Date().toISOString()
    };
  }),

  on(CartActions.removeFromCartError, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),

  // Update Quantity
  on(CartActions.updateCartItemQuantity, (state) => ({
    ...state,
    loading: true,
    error: null
  })),

  on(CartActions.updateCartItemQuantitySuccess, (state, { productId, quantity }) => {
    let updatedItems = state.items;

    if (quantity <= 0) {
      updatedItems = state.items.filter(i => i.product_id !== productId);
    } else {
      updatedItems = state.items.map(i =>
        i.product_id === productId ? { ...i, quantity } : i
      );
    }

    return {
      ...state,
      items: updatedItems,
      itemCount: updatedItems.reduce((sum, i) => sum + i.quantity, 0),
      loading: false,
      lastUpdated: new Date().toISOString()
    };
  }),

  on(CartActions.updateCartItemQuantityError, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),

  // Clear Cart
  on(CartActions.clearCart, (state) => ({
    ...state,
    loading: true,
    error: null
  })),

  on(CartActions.clearCartSuccess, (state) => ({
    ...state,
    items: [],
    subtotal: 0,
    tax: 0,
    shipping: 0,
    total: 0,
    itemCount: 0,
    coupon: undefined,
    couponDiscount: 0,
    loading: false,
    lastUpdated: new Date().toISOString()
  })),

  on(CartActions.clearCartError, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),

  // Load Cart
  on(CartActions.loadCart, (state) => ({
    ...state,
    loading: true,
    error: null
  })),

  on(CartActions.loadCartSuccess, (state, { items }) => {
    const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);
    return {
      ...state,
      items,
      itemCount,
      loading: false,
      lastUpdated: new Date().toISOString()
    };
  }),

  on(CartActions.loadCartError, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),

  // Apply Coupon
  on(CartActions.applyCoupon, (state) => ({
    ...state,
    loading: true,
    error: null
  })),

  on(CartActions.applyCouponSuccess, (state, { coupon, discount, percent }) => ({
    ...state,
    coupon,
    couponDiscount: discount,
    couponPercent: percent,
    loading: false,
    lastUpdated: new Date().toISOString()
  })),

  on(CartActions.applyCouponError, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),

  // Remove Coupon
  on(CartActions.removeCoupon, (state) => ({
    ...state,
    loading: true,
    error: null
  })),

  on(CartActions.removeCouponSuccess, (state) => ({
    ...state,
    coupon: undefined,
    couponDiscount: 0,
    couponPercent: 0,
    loading: false,
    lastUpdated: new Date().toISOString()
  })),

  on(CartActions.removeCouponError, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),

  // Calculate Totals
  on(CartActions.calculateTotalsSuccess, (state, { subtotal, tax, shipping, total }) => ({
    ...state,
    subtotal,
    tax,
    shipping,
    total
  })),

  // Clear Error
  on(CartActions.clearCartError, (state) => ({
    ...state,
    error: null
  }))
);
