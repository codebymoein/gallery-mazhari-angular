/**
 * Cart Service
 * Manages shopping cart operations
 */

import { isPlatformBrowser } from '@angular/common';
import { Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { Store } from '@ngrx/store';
import { map, Observable, take } from 'rxjs';
import { CartItem, EngravingRequest } from '@shared/models';
import * as CartActions from '../store/cart/cart.actions';
import * as CartSelectors from '../store/cart/cart.selectors';

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private readonly cartTtlMs = 24 * 60 * 60 * 1000;
  private readonly isBrowser: boolean;
  // Selectors
  cartItems$ = this.store.select(CartSelectors.selectCartItems);
  cartItemCount$ = this.store.select(CartSelectors.selectCartItemCount);
  cartTotals$ = this.store.select(CartSelectors.selectCartTotals);
  cartLoading$ = this.store.select(CartSelectors.selectCartLoading);
  cartError$ = this.store.select(CartSelectors.selectCartError);
  emptyCart$ = this.store.select(CartSelectors.selectEmptyCart);
  cartSummary$ = this.store.select(CartSelectors.selectCartSummary);
  cartValue$ = this.store.select(CartSelectors.selectCartValue);

  constructor(
    private store: Store,
    @Inject(PLATFORM_ID) platformId: object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
    if (!this.isBrowser) return;

    // Browser persistence is client-only; SSR must never read localStorage or keep timers alive.
    this.loadCart();
    setInterval(() => this.expireStaleCart(), 60 * 1000);
  }

  restoreItems(items: CartItem[]): void {
    this.clearCart();
    for (const item of items) {
      this.addToCart({ ...item, added_at: new Date().toISOString() });
    }
  }

  private expireStaleCart(): void {
    if (!this.isBrowser) return;
    try {
      const raw = localStorage.getItem('mazhari_cart');
      if (!raw) return;
      const stored = JSON.parse(raw);
      const expiresAt = Array.isArray(stored)
        ? Math.max(0, ...stored.map((item: CartItem) => Date.parse(item.added_at || ''))) + this.cartTtlMs
        : Number(stored?.expiresAt || 0);
      if (expiresAt > 0 && expiresAt <= Date.now()) {
        this.clearCart();
      }
    } catch {
      this.clearCart();
    }
  }

  /** Add item to cart. */
  addToCart(item: CartItem): void {
    this.store.dispatch(CartActions.addToCart({ item }));
  }

  /** Add product to cart with defaults. */
  addProductToCart(
    productId: number,
    quantity: number = 1,
    price: number = 0,
    productName?: string,
    productImage?: string,
    options?: {
      categorySlug?: string;
      sourceId?: string;
      attributes?: Array<{ name: string; value: string }>;
      engraving?: EngravingRequest;
    }
  ): void {
    const item: CartItem = {
      product_id: productId,
      quantity,
      price,
      product_name: productName,
      product_image: productImage,
      category_slug: options?.categorySlug,
      source_id: options?.sourceId,
      attributes: options?.attributes,
      engraving: options?.engraving,
      added_at: new Date().toISOString()
    };
    this.addToCart(item);
  }

  /** Remove item from cart. */
  removeFromCart(productId: number): void {
    this.store.dispatch(CartActions.removeFromCart({ productId }));
  }

  /** Update item quantity. */
  updateQuantity(productId: number, quantity: number): void {
    if (quantity <= 0) {
      this.removeFromCart(productId);
    } else {
      this.store.dispatch(
        CartActions.updateCartItemQuantity({ productId, quantity })
      );
    }
  }

  incrementQuantity(productId: number): void {
    this.store.select(CartSelectors.selectCartItemByProductId(productId))
      .pipe(take(1))
      .subscribe(item => {
        if (item) this.updateQuantity(productId, item.quantity + 1);
      });
  }

  decrementQuantity(productId: number): void {
    this.store.select(CartSelectors.selectCartItemByProductId(productId))
      .pipe(take(1))
      .subscribe(item => {
        if (item) this.updateQuantity(productId, item.quantity - 1);
      });
  }

  clearCart(): void {
    this.store.dispatch(CartActions.clearCart());
  }

  loadCart(): void {
    if (this.isBrowser) this.store.dispatch(CartActions.loadCart());
  }

  applyCoupon(coupon: string): void {
    this.store.dispatch(CartActions.applyCoupon({ coupon }));
  }

  getCartItems(): Observable<CartItem[]> {
    return this.cartItems$;
  }

  getItemCount(): Observable<number> {
    return this.cartItemCount$;
  }

  getCartTotals(): Observable<{ subtotal: number; discount: number; total: number }> {
    return this.cartTotals$;
  }

  isInCart(productId: number): Observable<boolean> {
    return this.store.select(CartSelectors.selectCartItemByProductId(productId)).pipe(
      map(item => !!item)
    );
  }

  getItemQuantity(productId: number): Observable<number> {
    return this.store.select(CartSelectors.selectCartItemByProductId(productId)).pipe(
      map(item => item?.quantity || 0)
    );
  }
}
