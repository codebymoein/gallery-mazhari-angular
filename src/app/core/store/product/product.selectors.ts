/**
 * Product Store Selectors
 * Memoized selectors for efficient state queries
 */

import { createFeatureSelector, createSelector } from '@ngrx/store';
import { ProductState } from './product.state';

export const selectProductState = createFeatureSelector<ProductState>('products');

// Products
export const selectAllProducts = createSelector(
  selectProductState,
  (state: ProductState) => state.products
);

export const selectProductCount = createSelector(
  selectProductState,
  (state: ProductState) => state.products.length
);

export const selectTotalProductCount = createSelector(
  selectProductState,
  (state: ProductState) => state.totalCount
);

// Selected Product
export const selectSelectedProduct = createSelector(
  selectProductState,
  (state: ProductState) => state.selectedProduct
);

export const selectProductById = (id: number) =>
  createSelector(
    selectAllProducts,
    (products) => products.find(p => p.id === id) || null
  );

// Categories
export const selectAllCategories = createSelector(
  selectProductState,
  (state: ProductState) => state.categories
);

export const selectSelectedCategory = createSelector(
  selectProductState,
  (state: ProductState) => state.selectedCategory
);

export const selectCategoryById = (id: number) =>
  createSelector(
    selectAllCategories,
    (categories) => categories.find(c => c.id === id) || null
  );

// Filters
export const selectFilters = createSelector(
  selectProductState,
  (state: ProductState) => state.filters
);

export const selectSearchQuery = createSelector(
  selectFilters,
  (filters) => filters.search || ''
);

export const selectSortBy = createSelector(
  selectFilters,
  (filters) => ({
    orderby: filters.orderby || 'date',
    order: filters.order || 'desc'
  })
);

export const selectPriceRange = createSelector(
  selectFilters,
  (filters) => ({
    min: filters.min_price || 0,
    max: filters.max_price || 0
  })
);

// Pagination
export const selectCurrentPage = createSelector(
  selectProductState,
  (state: ProductState) => state.currentPage
);

export const selectPageSize = createSelector(
  selectProductState,
  (state: ProductState) => state.pageSize
);

export const selectTotalPages = createSelector(
  selectTotalProductCount,
  selectPageSize,
  (total, pageSize) => Math.ceil(total / pageSize)
);

export const selectHasNextPage = createSelector(
  selectCurrentPage,
  selectTotalPages,
  (current, total) => current < total
);

export const selectHasPreviousPage = createSelector(
  selectCurrentPage,
  (current) => current > 1
);

// Loading State
export const selectProductLoading = createSelector(
  selectProductState,
  (state: ProductState) => state.loading
);

// Error State
export const selectProductError = createSelector(
  selectProductState,
  (state: ProductState) => state.error
);

// Computed Selectors
export const selectEmptyProducts = createSelector(
  selectAllProducts,
  selectProductLoading,
  (products, loading) => products.length === 0 && !loading
);

export const selectFeaturedProducts = createSelector(
  selectAllProducts,
  (products) => products.filter(p => {
    const meta = p.meta_data?.find(m => m.key === 'featured');
    return meta?.value === '1';
  })
);

export const selectOnSaleProducts = createSelector(
  selectAllProducts,
  (products) => products.filter(p => p.on_sale)
);

export const selectProductsByCategory = (categoryId: number) =>
  createSelector(
    selectAllProducts,
    (products) => products.filter(p =>
      p.categories?.some(c => c.id === categoryId)
    )
  );

export const selectProductsInPriceRange = (min: number, max: number) =>
  createSelector(
    selectAllProducts,
    (products) => products.filter(p => {
      const price = parseFloat(p.price);
      return price >= min && price <= max;
    })
  );

// Stats
export const selectProductStats = createSelector(
  selectAllProducts,
  selectTotalProductCount,
  selectCurrentPage,
  selectPageSize,
  (products, total, current, pageSize) => ({
    total,
    displayed: products.length,
    page: current,
    pageSize,
    totalPages: Math.ceil(total / pageSize)
  })
);
