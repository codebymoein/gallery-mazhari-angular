/**
 * Cart Store Effects
 * Side effects for cart state management
 */

import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { of } from 'rxjs';
import { map, switchMap, tap, withLatestFrom } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import { AdminMarketingService } from '@core/services/admin-marketing.service';
import { environment } from '@env/environment';
import { CartItem } from '@shared/models';

import * as CartActions from './cart.actions';
import * as CartSelectors from './cart.selectors';

const CART_STORAGE_KEY = environment.storageKeys.cart;
const CART_TTL_MS = 24 * 60 * 60 * 1000;

interface StoredCart {
  items: CartItem[];
  expiresAt: number;
}

@Injectable()
export class CartEffects {
  private readonly marketing = inject(AdminMarketingService);

  addToCart$ = createEffect(() =>
    this.actions$.pipe(
      ofType(CartActions.addToCart),
      map(({ item }) => CartActions.addToCartSuccess({ item }))
    )
  );

  removeFromCart$ = createEffect(() =>
    this.actions$.pipe(
      ofType(CartActions.removeFromCart),
      map(({ productId }) => CartActions.removeFromCartSuccess({ productId }))
    )
  );

  updateCartItemQuantity$ = createEffect(() =>
    this.actions$.pipe(
      ofType(CartActions.updateCartItemQuantity),
      map(({ productId, quantity }) =>
        CartActions.updateCartItemQuantitySuccess({ productId, quantity })
      )
    )
  );

  clearCart$ = createEffect(() =>
    this.actions$.pipe(
      ofType(CartActions.clearCart),
      map(() => {
        try {
          localStorage.removeItem(CART_STORAGE_KEY);
        } catch {
          // Storage unavailable (private mode / quota) — state still clears.
        }
        return CartActions.clearCartSuccess();
      })
    )
  );

  loadCart$ = createEffect(() =>
    this.actions$.pipe(
      ofType(CartActions.loadCart),
      switchMap(() => {
        try {
          const savedCart = localStorage.getItem(CART_STORAGE_KEY);
          if (savedCart) {
            const stored = JSON.parse(savedCart) as StoredCart | CartItem[];
            if (Array.isArray(stored)) {
              const newestAddedAt = stored.reduce<number>((latest, item) => {
                const timestamp = Date.parse(item?.added_at || '');
                return Number.isFinite(timestamp) ? Math.max(latest, timestamp) : latest;
              }, 0);
              if (newestAddedAt && newestAddedAt + CART_TTL_MS <= Date.now()) {
                localStorage.removeItem(CART_STORAGE_KEY);
                return of(CartActions.loadCartSuccess({ items: [] }));
              }
              return of(CartActions.loadCartSuccess({ items: stored }));
            }
            if (stored && Array.isArray(stored.items)) {
              if (stored.expiresAt <= Date.now()) {
                localStorage.removeItem(CART_STORAGE_KEY);
                return of(CartActions.loadCartSuccess({ items: [] }));
              }
              return of(CartActions.loadCartSuccess({ items: stored.items }));
            }
          }
        } catch {
          return of(
            CartActions.loadCartError({ error: 'Failed to parse cart from storage' })
          );
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
      map(() => CartActions.removeCouponSuccess())
    )
  );

  /**
   * Shipping is chosen at checkout and there is no VAT line — the cart's
   * payable amount is simply the items subtotal.
   */
  calculateTotals$ = createEffect(() =>
    this.actions$.pipe(
      ofType(CartActions.calculateTotals),
      withLatestFrom(this.store.select(CartSelectors.selectCartItems)),
      map(([, items]) => {
        const subtotal = items.reduce(
          (sum, item) => sum + item.price * item.quantity,
          0
        );

        return CartActions.calculateTotalsSuccess({
          subtotal,
          tax: 0,
          shipping: 0,
          total: subtotal
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
          CartActions.applyCouponSuccess,
          CartActions.removeCouponSuccess,
          CartActions.loadCartSuccess
        ),
        tap(() => {
          this.store.dispatch(CartActions.calculateTotals());
        })
      ),
    { dispatch: false }
  );

  /**
   * Persist the cart AFTER the reducer has applied the mutation.
   * A single long-lived effect — never subscribe per action (the previous
   * implementation leaked one store subscription per cart operation).
   */
  persistCart$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(
          CartActions.addToCartSuccess,
          CartActions.removeFromCartSuccess,
          CartActions.updateCartItemQuantitySuccess
        ),
        withLatestFrom(this.store.select(CartSelectors.selectCartItems)),
        tap(([, items]) => {
          try {
            const stored: StoredCart = {
              items,
              expiresAt: Date.now() + CART_TTL_MS
            };
            localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(stored));
          } catch {
            // Storage unavailable — cart stays in memory for the session.
          }
        })
      ),
    { dispatch: false }
  );

  constructor(
    private actions$: Actions,
    private store: Store
  ) {}
}
