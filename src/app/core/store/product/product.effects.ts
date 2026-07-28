/**
 * Product Store Effects
 * Side effects for product state management
 */

import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { of } from 'rxjs';
import { catchError, map, switchMap, debounceTime } from 'rxjs/operators';

import { WordPressService } from '@core/api/wordpress.service';
import * as ProductActions from './product.actions';

@Injectable()
export class ProductEffects {
  loadProducts$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ProductActions.loadProducts),
      switchMap(({ filters }) =>
        this.wpService.getProducts(filters).pipe(
          map((response: any) => {
            // Handle both direct array response and paginated response
            const products = Array.isArray(response) ? response : response.products || [];
            const totalCount = Array.isArray(response) ? products.length : response.total || 0;
            
            return ProductActions.loadProductsSuccess({
              products,
              totalCount
            });
          }),
          catchError((error) =>
            of(ProductActions.loadProductsError({
              error: error.message || 'Failed to load products'
            }))
          )
        )
      )
    )
  );

  loadProduct$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ProductActions.loadProduct),
      switchMap(({ id }) =>
        this.wpService.getProduct(id).pipe(
          map((product) =>
            ProductActions.loadProductSuccess({ product })
          ),
          catchError((error) =>
            of(ProductActions.loadProductError({
              error: error.message || `Failed to load product ${id}`
            }))
          )
        )
      )
    )
  );

  loadCategories$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ProductActions.loadCategories),
      switchMap(() =>
        this.wpService.getCategories().pipe(
          map((response: any) => {
            const categories = Array.isArray(response) ? response : response.categories || [];
            return ProductActions.loadCategoriesSuccess({ categories });
          }),
          catchError((error) =>
            of(ProductActions.loadCategoriesError({
              error: error.message || 'Failed to load categories'
            }))
          )
        )
      )
    )
  );

  selectCategory$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ProductActions.selectCategory),
      map(({ category }) =>
        ProductActions.loadProducts({ filters: { parent: category.id } })
      )
    )
  );

  updateFilters$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ProductActions.updateFilters),
      debounceTime(300),
      map(({ filters }) =>
        ProductActions.loadProducts({ filters })
      )
    )
  );

  searchProducts$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ProductActions.searchProducts),
      debounceTime(500),
      switchMap(({ query }) =>
        this.wpService.searchProducts(query, 20).pipe(
          map((response: any) => {
            const products = Array.isArray(response) ? response : response.products || [];
            return ProductActions.searchProductsSuccess({ products });
          }),
          catchError((error) =>
            of(ProductActions.searchProductsError({
              error: error.message || 'Search failed'
            }))
          )
        )
      )
    )
  );

  setPage$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ProductActions.setPage),
      map(({ page }) =>
        ProductActions.loadProducts({ filters: { page } })
      )
    )
  );

  setPageSize$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ProductActions.setPageSize),
      map(({ pageSize }) =>
        ProductActions.loadProducts({ filters: { per_page: pageSize, page: 1 } })
      )
    )
  );

  resetFilters$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ProductActions.resetFilters),
      map(() =>
        ProductActions.loadProducts({ filters: { page: 1, per_page: 12 } })
      )
    )
  );

  // Auto-load categories on init
  initCategories$ = createEffect(() =>
    this.actions$.pipe(
      ofType('[App] Init'),
      map(() => ProductActions.loadCategories())
    )
  );

  constructor(
    private actions$: Actions,
    private wpService: WordPressService
  ) {}
}
