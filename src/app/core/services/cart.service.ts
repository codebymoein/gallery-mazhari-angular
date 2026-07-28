/**
 * Cart Service
 * Manages shopping cart operations
 */

import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { CartItem } from '@shared/models';
import * as CartActions from '../store/cart/cart.actions';
import * as CartSelectors from '../store/cart/cart.selectors';

@Injectable({
  providedIn: 'root'
})
export class CartService {
  // Selectors
  cartItems$ = this.store.select(CartSelectors.selectCartItems);
  cartItemCount$ = this.store.select(CartSelectors.selectCartItemCount);
  cartTotals$ = this.store.select(CartSelectors.selectCartTotals);
  cartLoading$ = this.store.select(CartSelectors.selectCartLoading);
  cartError$ = this.store.select(CartSelectors.selectCartError);
  emptyCart$ = this.store.select(CartSelectors.selectEmptyCart);
  cartSummary$ = this.store.select(CartSelectors.selectCartSummary);
  cartValue$ = this.store.select(CartSelectors.selectCartValue);

  constructor(private store: Store) {
    // Load cart from localStorage on init
    this.loadCart();
  }

  /**
   * Add item to cart
   */
  addToCart(item: CartItem): void {
    this.store.dispatch(CartActions.addToCart({ item }));
  }

  /**
   * Add product to cart with defaults
   */
  addProductToCart(
    productId: number,
    quantity: number = 1,
    price: number = 0,
    productName?: string,
    productImage?: string,
    options?: { categorySlug?: string; sourceId?: string }
  ): void {
    const item: CartItem = {
      product_id: productId,
      quantity,
      price,
      product_name: productName,
      product_image: productImage,
      category_slug: options?.categorySlug,
      source_id: options?.sourceId,
      added_at: new Date().toISOString()
    };
    this.addToCart(item);
  }

  /**
   * Remove item from cart
   */
  removeFromCart(productId: number): void {
    this.store.dispatch(CartActions.removeFromCart({ productId }));
  }

  /**
   * Update item quantity
   */
  updateQuantity(productId: number, quantity: number): void {
    if (quantity <= 0) {
      this.removeFromCart(productId);
    } else {
      this.store.dispatch(
        CartActions.updateCartItemQuantity({ productId, quantity })
      );
    }
  }

  /**
   * Increment item quantity
   */
  incrementQuantity(productId: number): void {
    this.store.select(CartSelectors.selectCartItemByProductId(productId))
      .subscribe(item => {
        if (item) {
          this.updateQuantity(productId, item.quantity + 1);
        }
      });
  }

  /**
   * Decrement item quantity
   */
  decrementQuantity(productId: number): void {
    this.store.select(CartSelectors.selectCartItemByProductId(productId))
      .subscribe(item => {
        if (item) {
          this.updateQuantity(productId, item.quantity - 1);
        }
      });
  }

  /**
   * Clear entire cart
   */
  clearCart(): void {
    this.store.dispatch(CartActions.clearCart());
  }

  /**
   * Load cart from localStorage
   */
  loadCart(): void {
    this.store.dispatch(CartActions.loadCart());
  }

  /**
   * Apply coupon code
   */
  applyCoupon(coupon: string): void {
    this.store.dispatch(CartActions.applyCoupon({ coupon }));
  }

  /**
   * Remove coupon
   */
  removeCoupon(): void {
    this.store.dispatch(CartActions.removeCoupon());
  }

  /**
   * Get cart items observable
   */
  getCartItems(): Observable<CartItem[]> {
    return this.cartItems$;
  }

  /**
   * Get cart totals observable
   */
  getCartTotals() {
    return this.cartTotals$;
  }

  /**
   * Get cart item count
   */
  getItemCount(): Observable<number> {
    return this.cartItemCount$;
  }

  /**
   * Get cart total value
   */
  getCartTotal(): Observable<number> {
    return this.store.select(CartSelectors.selectCartValue);
  }

  /**
   * Check if product is in cart
   */
  isProductInCart(productId: number): Observable<boolean> {
    return new Observable(observer => {
      this.cartItems$.subscribe(items => {
        observer.next(items.some(i => i.product_id === productId));
      });
    });
  }

  /**
   * Get product quantity in cart
   */
  getProductQuantity(productId: number): Observable<number> {
    return new Observable(observer => {
      this.store.select(CartSelectors.selectCartItemByProductId(productId))
        .subscribe(item => {
          observer.next(item?.quantity || 0);
        });
    });
  }

  /**
   * Get cart summary
   */
  getCartSummary(): Observable<any> {
    return this.cartSummary$;
  }

  /**
   * Calculate cart statistics
   */
  getCartStats(): Observable<any> {
    return this.store.select(CartSelectors.selectCartStats);
  }

  /**
   * Sync cart calculations
   */
  syncCart(): void {
    this.store.dispatch(CartActions.syncCart());
  }

  /**
   * Clear any cart errors
   */
  clearError(): void {
    this.store.dispatch(CartActions.clearCartError({ error: '' }));
  }

  /**
   * Export cart data for checkout
   */
  exportCartData(): Observable<any> {
    return new Observable(observer => {
      this.store.select(CartSelectors.selectCartSummary)
        .subscribe(summary => {
          observer.next({
            items: summary.items,
            itemCount: summary.itemCount,
            subtotal: summary.subtotal,
            tax: summary.tax,
            shipping: summary.shipping,
            discount: summary.couponDiscount || 0,
            total: summary.total,
            exportDate: new Date().toISOString()
          });
        });
    });
  }
}
