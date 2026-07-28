/**
 * Store Index
 * Central export point for all store files
 */

// Product Store
export * from './product/product.state';
export * from './product/product.actions';
export * from './product/product.reducer';
export * from './product/product.selectors';

// Cart Store
export * from './cart/cart.state';
export * from './cart/cart.actions';
export * from './cart/cart.reducer';
export * from './cart/cart.selectors';

// Store Configuration
import { productReducer } from './product/product.reducer';
import { cartReducer } from './cart/cart.reducer';

export const appStore = {
  products: productReducer,
  cart: cartReducer
};
