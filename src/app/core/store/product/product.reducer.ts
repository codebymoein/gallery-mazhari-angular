/**
 * Product Store Reducer
 * Pure functions to update product state
 */

import { createReducer, on } from '@ngrx/store';
import { initialProductState } from './product.state';
import * as ProductActions from './product.actions';

export const productReducer = createReducer(
  initialProductState,

  // Load Products
  on(ProductActions.loadProducts, (state) => ({
    ...state,
    loading: true,
    error: null
  })),

  on(ProductActions.loadProductsSuccess, (state, { products, totalCount }) => ({
    ...state,
    products,
    totalCount,
    loading: false,
    error: null
  })),

  on(ProductActions.loadProductsError, (state, { error }) => ({
    ...state,
    loading: false,
    error,
    products: []
  })),

  // Load Single Product
  on(ProductActions.loadProduct, (state) => ({
    ...state,
    loading: true,
    error: null,
    selectedProduct: null
  })),

  on(ProductActions.loadProductSuccess, (state, { product }) => ({
    ...state,
    selectedProduct: product,
    loading: false,
    error: null
  })),

  on(ProductActions.loadProductError, (state, { error }) => ({
    ...state,
    loading: false,
    error,
    selectedProduct: null
  })),

  // Load Categories
  on(ProductActions.loadCategories, (state) => ({
    ...state,
    loading: true,
    error: null
  })),

  on(ProductActions.loadCategoriesSuccess, (state, { categories }) => ({
    ...state,
    categories,
    loading: false,
    error: null
  })),

  on(ProductActions.loadCategoriesError, (state, { error }) => ({
    ...state,
    loading: false,
    error,
    categories: []
  })),

  // Select Category
  on(ProductActions.selectCategory, (state, { category }) => ({
    ...state,
    selectedCategory: category,
    filters: {
      ...state.filters,
      parent: category.id,
      page: 1
    },
    currentPage: 1
  })),

  // Update Filters
  on(ProductActions.updateFilters, (state, { filters }) => ({
    ...state,
    filters: {
      ...state.filters,
      ...filters,
      page: 1
    },
    currentPage: 1
  })),

  // Search Products
  on(ProductActions.searchProducts, (state) => ({
    ...state,
    loading: true,
    error: null
  })),

  on(ProductActions.searchProductsSuccess, (state, { products }) => ({
    ...state,
    products,
    loading: false,
    error: null
  })),

  on(ProductActions.searchProductsError, (state, { error }) => ({
    ...state,
    loading: false,
    error,
    products: []
  })),

  // Clear Error
  on(ProductActions.clearProductError, (state) => ({
    ...state,
    error: null
  })),

  // Reset Filters
  on(ProductActions.resetFilters, (state) => ({
    ...state,
    filters: initialProductState.filters,
    currentPage: 1
  })),

  // Pagination
  on(ProductActions.setPage, (state, { page }) => ({
    ...state,
    filters: {
      ...state.filters,
      page
    },
    currentPage: page
  })),

  on(ProductActions.setPageSize, (state, { pageSize }) => ({
    ...state,
    filters: {
      ...state.filters,
      per_page: pageSize,
      page: 1
    },
    pageSize,
    currentPage: 1
  }))
);
