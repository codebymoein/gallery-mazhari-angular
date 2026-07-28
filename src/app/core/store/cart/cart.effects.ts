/**
 * Cart Store Effects
 * Side effects for cart state management
 */

import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { of } from 'rxjs';
import { catchError, map, switchMap, tap, withLatestFrom } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import { AdminMarketingService } from '@core/services/admin-marketing.service';

import * as CartActions from './cart.actions';
import * as CartSelectors from './cart.selectors';

@Injectable()
export class CartEffects {
  private readonly marketing = inject(AdminMarketingService);
  addToCart$ = createEffect(() =>
    this.actions$.pipe(
      ofType(CartActions.addToCart),
      map(({ item }) => {
        // Save to localStorage
        this.saveCartToLocalStorage();
        return CartActions.addToCartSuccess({ item });
      }),
      catchError((error) =>
        of(CartActions.addToCartError({
          error: error.message || 'Failed to add item to cart'
        }))
      )
    )
  );

  removeFromCart$ = createEffect(() =>
    this.actions$.pipe(
      ofType(CartActions.removeFromCart),
      map(({ productId }) => {
        this.saveCartToLocalStorage();
        return CartActions.removeFromCartSuccess({ productId });
      }),
      catchError((error) =>
        of(CartActions.removeFromCartError({
          error: error.message || 'Failed to remove item from cart'
        }))
      )
    )
  );

  updateCartItemQuantity$ = createEffect(() =>
    this.actions$.pipe(
      ofType(CartActions.updateCartItemQuantity),
      map(({ productId, quantity }) => {
        this.saveCartToLocalStorage();
        return CartActions.updateCartItemQuantitySuccess({ productId, quantity });
      }),
      catchError((error) =>
        of(CartActions.updateCartItemQuantityError({
          error: error.message || 'Failed to update cart item'
        }))
      )
    )
  );

  clearCart$ = createEffect(() =>
    this.actions$.pipe(
      ofType(CartActions.clearCart),
      map(() => {
        localStorage.removeItem('cart');
        return CartActions.clearCartSuccess();
      }),
      catchError((error) =>
        of(CartActions.clearCartError({
          error: error.message || 'Failed to clear cart'
        }))
      )
    )
  );

  loadCart$ = createEffect(() =>
    this.actions$.pipe(
      ofType(CartActions.loadCart),
      switchMap(() => {
        const savedCart = localStorage.getItem('cart');
        if (savedCart) {
          try {
            const items = JSON.parse(savedCart);
            return of(CartActions.loadCartSuccess({ items }));
          } catch (error) {
            return of(CartActions.loadCartError({
              error: 'Failed to parse cart from storage'
            }));
          }
        }
        return of(CartActions.loadCartSuccess({ items: [] }));
      })
    )
  );

  applyCoupon$ = createEffect(() =>
    this.actions$.pipe(
      ofType(CartActions.applyCoupon),
      withLatestFrom(
        this.store.select(CartSelectors.selectCartItems),
        this.store.select(CartSelectors.selectSubtotal)
      ),
      switchMap(([{ coupon }, items, subtotal]) => {
        const itemsSubtotal =
          subtotal > 0
            ? subtotal
            : items.reduce((sum, item) => sum + item.price * item.quantity, 0);
        const resolved = this.marketing.resolveDiscount(coupon, itemsSubtotal);

        if (resolved && resolved.amount > 0) {
          this.saveCartToLocalStorage();
          return of(
            CartActions.applyCouponSuccess({
              coupon: resolved.code,
              discount: resolved.amount,
              percent: resolved.percent
            })
          );
        }

        return of(
          CartActions.applyCouponError({
            error: 'کد تخفیف نامعتبر یا منقضی است'
          })
        );
      })
    )
  );

  removeCoupon$ = createEffect(() =>
    this.actions$.pipe(
      ofType(CartActions.removeCoupon),
      map(() => {
        this.saveCartToLocalStorage();
        return CartActions.removeCouponSuccess();
      }),
      catchError((error) =>
        of(CartActions.removeCouponError({
          error: error.message || 'Failed to remove coupon'
        }))
      )
    )
  );

  calculateTotals$ = createEffect(() =>
    this.actions$.pipe(
      ofType(CartActions.calculateTotals),
      withLatestFrom(this.store.select(CartSelectors.selectCartItems)),
      map(([_, items]) => {
        const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const tax = subtotal * 0.1; // 10% tax
        const shipping = 5; // Fixed shipping
        const total = subtotal + tax + shipping;

        return CartActions.calculateTotalsSuccess({
          subtotal,
          tax,
          shipping,
          total
        });
      })
    )
  );

  syncCart$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(
          CartActions.addToCartSuccess,
          CartActions.removeFromCartSuccess,
          CartActions.updateCartItemQuantitySuccess,
          CartActions.applyCouponSuccess
        ),
        tap(() => {
          this.store.dispatch(CartActions.calculateTotals());
        })
      ),
    { dispatch: false }
  );

  // Auto-load cart on init
  initCart$ = createEffect(() =>
    this.actions$.pipe(
      ofType('[App] Init'),
      map(() => CartActions.loadCart())
    )
  );

  constructor(
    private actions$: Actions,
    private store: Store
  ) {}

  private saveCartToLocalStorage(): void {
    this.store.select(CartSelectors.selectCartItems).subscribe(items => {
      localStorage.setItem('cart', JSON.stringify(items));
    });
  }
}
