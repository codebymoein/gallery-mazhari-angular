import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { map, Observable } from 'rxjs';
import { CartService } from '@core/services/cart.service';
import { ShoppingContextService } from '@core/services/shopping-context.service';
import { CartItem } from '@shared/models';
import { HomeTrialService } from '@core/services/home-trial.service';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './cart.component.html',
  styleUrls: ['./cart.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CartComponent {
  private readonly cart = inject(CartService);
  private readonly shoppingContext = inject(ShoppingContextService);
  readonly homeTrial = inject(HomeTrialService);

  readonly cartItems$ = this.cart.cartItems$;
  readonly cartTotals$ = this.cart.cartTotals$;
  readonly emptyCart$ = this.cart.emptyCart$;
  readonly purchaseItems$ = this.cartItems$.pipe(map(items => items.filter(item => item.source_id !== 'HOME-TRIAL-DEPOSIT')));
  readonly trialDeposit$ = this.cartItems$.pipe(map(items => items.find(item => item.source_id === 'HOME-TRIAL-DEPOSIT') || null));

  /** Contextual «ادامه خرید» based on products currently in the cart. */
  readonly continueShoppingLink$: Observable<string[]> = this.cartItems$.pipe(
    map(items => this.shoppingContext.continueShoppingLink(items))
  );

  formatPrice(amount: number): string {
    return new Intl.NumberFormat('fa-IR').format(Math.round(amount)) + ' ریال';
  }

  lineTotal(item: CartItem): number {
    return item.price * item.quantity;
  }

  increment(productId: number): void {
    this.cart.incrementQuantity(productId);
  }

  decrement(productId: number): void {
    this.cart.decrementQuantity(productId);
  }

  remove(productId: number): void {
    this.cart.removeFromCart(productId);
  }

  onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.hidden = true;
  }

  trackByProductId(_index: number, item: CartItem): number {
    return item.product_id;
  }
}
