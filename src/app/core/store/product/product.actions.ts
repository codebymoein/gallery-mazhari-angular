/**
 * Product Store Actions
 * Actions for product state management
 */

import { createAction, props } from '@ngrx/store';
import { Product, Category, ProductFilter } from '@shared/models';

// Load Products
export const loadProducts = createAction(
  '[Product] Load Products',
  props<{ filters?: ProductFilter }>()
);

export const loadProductsSuccess = createAction(
  '[Product] Load Products Success',
  props<{ products: Product[]; totalCount: number }>()
);

export const loadProductsError = createAction(
  '[Product] Load Products Error',
  props<{ error: string }>()
);

// Load Single Product
export const loadProduct = createAction(
  '[Product] Load Product',
  props<{ id: number }>()
);

export const loadProductSuccess = createAction(
  '[Product] Load Product Success',
  props<{ product: Product }>()
);

export const loadProductError = createAction(
  '[Product] Load Product Error',
  props<{ error: string }>()
);

// Load Categories
export const loadCategories = createAction(
  '[Product] Load Categories'
);

export const loadCategoriesSuccess = createAction(
  '[Product] Load Categories Success',
  props<{ categories: Category[] }>()
);

export const loadCategoriesError = createAction(
  '[Product] Load Categories Error',
  props<{ error: string }>()
);

// Select Category
export const selectCategory = createAction(
  '[Product] Select Category',
  props<{ category: Category }>()
);

// Update Filters
export const updateFilters = createAction(
  '[Product] Update Filters',
  props<{ filters: Partial<ProductFilter> }>()
);

// Search Products
export const searchProducts = createAction(
  '[Product] Search Products',
  props<{ query: string }>()
);

export const searchProductsSuccess = createAction(
  '[Product] Search Products Success',
  props<{ products: Product[] }>()
);

export const searchProductsError = createAction(
  '[Product] Search Products Error',
  props<{ error: string }>()
);

// Clear Error
export const clearProductError = createAction(
  '[Product] Clear Error'
);

// Reset Filters
export const resetFilters = createAction(
  '[Product] Reset Filters'
);

// Pagination
export const setPage = createAction(
  '[Product] Set Page',
  props<{ page: number }>()
);

export const setPageSize = createAction(
  '[Product] Set Page Size',
  props<{ pageSize: number }>()
);
