/**
 * Product Store State
 * Manages products, categories, and product-related data
 */

import { Product, Category, ProductFilter } from '@shared/models';

export interface ProductState {
  products: Product[];
  selectedProduct: Product | null;
  categories: Category[];
  selectedCategory: Category | null;
  filters: ProductFilter;
  loading: boolean;
  error: string | null;
  totalCount: number;
  currentPage: number;
  pageSize: number;
}

export const initialProductState: ProductState = {
  products: [],
  selectedProduct: null,
  categories: [],
  selectedCategory: null,
  filters: {
    page: 1,
    per_page: 12,
    orderby: 'date',
    order: 'desc'
  },
  loading: false,
  error: null,
  totalCount: 0,
  currentPage: 1,
  pageSize: 12
};
