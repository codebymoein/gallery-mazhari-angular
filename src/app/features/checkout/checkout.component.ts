import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnInit,
  inject
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { combineLatest, map, Observable, take } from 'rxjs';
import { CartService } from '@core/services/cart.service';
import {
  CheckoutDraft,
  LocalOrder,
  OrderService
} from '@core/services/order.service';
import { ShoppingContextService } from '@core/services/shopping-context.service';
import { CartItem } from '@shared/models';
import { onImgErrorUseFallback } from '@shared/utils/asset-url';

type CheckoutStep = 1 | 2 | 3;

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './checkout.component.html',
  styleUrls: ['./checkout.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CheckoutComponent implements OnInit {
  private readonly cart = inject(CartService);
  private readonly orders = inject(OrderService);
  private readonly shoppingContext = inject(ShoppingContextService);
  private readonly cdr = inject(ChangeDetectorRef);

  readonly cartItems$ = this.cart.cartItems$;
  readonly emptyCart$ = this.cart.emptyCart$;
  readonly cartSummary$ = this.cart.cartSummary$;

  readonly continueShoppingLink$: Observable<string[]> = this.cartItems$.pipe(
    map((items) => this.shoppingContext.continueShoppingLink(items))
  );

  draft: CheckoutDraft = this.orders.emptyDraft();
  step: CheckoutStep = 1;
  gatewayReady = false;
  createdOrder: LocalOrder | null = null;
  postOrderContinueLink: string[] = ['/'];
  addressErrors: Record<string, string> = {};
  couponInput = '';
  couponError = '';

  readonly shippingOptions: Array<{
    value: CheckoutDraft['shippingMethod'];
    title: string;
    desc: string;
  }> = [
    {
      value: 'standard',
      title: 'ارسال عادی',
      desc: '۳–۵ روز کاری — مناسب سفارش‌های برنامه‌ریزی‌شده'
    },
    {
      value: 'express',
      title: 'ارسال سریع',
      desc: '۱–۲ روز کاری — برای زمان‌های فشرده'
    },
    {
      value: 'pickup',
      title: 'تحویل حضوری',
      desc: 'دریافت از شعبه گالری — بدون هزینه ارسال'
    }
  ];

  readonly onImgError = onImgErrorUseFallback;

  ngOnInit(): void {
    this.draft = this.orders.loadDraft();
    this.step = this.draft.step;
  }

  formatPrice(amount: number): string {
    return new Intl.NumberFormat('fa-IR').format(Math.round(amount)) + ' تومان';
  }

  shippingCost(): number {
    return this.orders.shippingCost(this.draft.shippingMethod);
  }

  shippingCostFor(method: CheckoutDraft['shippingMethod']): number {
    return this.orders.shippingCost(method);
  }

  shippingLabel(): string {
    return this.orders.shippingLabel(this.draft.shippingMethod);
  }

  lineTotal(item: CartItem): number {
    return item.price * item.quantity;
  }

  subtotal(items: CartItem[]): number {
    return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }

  /** جمع قبل از تخفیف (جزء + ارسال) */
  grossTotal(items: CartItem[]): number {
    return this.subtotal(items) + this.shippingCost();
  }

  payableTotal(items: CartItem[], discount: number): number {
    return Math.max(0, this.grossTotal(items) - (discount || 0));
  }

  applyCoupon(): void {
    this.couponError = '';
    const code = this.couponInput.trim();
    if (!code) {
      this.couponError = 'کد تخفیف را وارد کنید.';
      return;
    }
    this.cart.applyCoupon(code);
    window.setTimeout(() => {
      this.cart.cartSummary$.pipe(take(1)).subscribe((s) => {
        if (!s.coupon) {
          this.couponError = 'کد تخفیف نامعتبر یا منقضی است.';
        } else {
          this.couponInput = s.coupon;
        }
        this.cdr.markForCheck();
      });
      this.cart.cartError$.pipe(take(1)).subscribe((err) => {
        if (err) this.couponError = err;
        this.cdr.markForCheck();
      });
    }, 120);
  }

  removeCoupon(): void {
    this.cart.removeCoupon();
    this.couponInput = '';
    this.couponError = '';
  }

  goToStep(next: CheckoutStep): void {
    if (next === 2 && !this.validateAddress()) {
      return;
    }
    this.step = next;
    this.draft.step = next;
    this.persistDraft();
    this.cdr.markForCheck();
  }

  onDraftChange(): void {
    this.persistDraft();
  }

  selectShipping(method: CheckoutDraft['shippingMethod']): void {
    this.draft.shippingMethod = method;
    this.persistDraft();
    this.cdr.markForCheck();
  }

  submitPayment(): void {
    if (!this.validateAddress()) {
      this.step = 1;
      this.draft.step = 1;
      this.persistDraft();
      this.cdr.markForCheck();
      return;
    }

    combineLatest([
      this.cart.cartItems$.pipe(take(1)),
      this.cart.emptyCart$.pipe(take(1)),
      this.cart.cartSummary$.pipe(take(1))
    ])
      .pipe(map(([items, empty, summary]) => ({ items, empty, summary })))
      .subscribe(({ items, empty, summary }) => {
        if (empty || items.length === 0) {
          return;
        }

        this.postOrderContinueLink = this.shoppingContext.continueShoppingLink(items);

        const subtotal = this.subtotal(items);
        const shipping = this.shippingCost();
        const discount = summary.couponDiscount || 0;
        const total = Math.max(0, subtotal + shipping - discount);

        this.createdOrder = this.orders.createOrderFromCheckout(this.draft, items, {
          subtotal,
          shipping,
          total
        });
        this.cart.clearCart();
        this.gatewayReady = true;
        this.cdr.markForCheck();
      });
  }

  trackByProductId(_index: number, item: CartItem): number {
    return item.product_id;
  }

  private persistDraft(): void {
    this.draft.step = this.step;
    this.orders.saveDraft(this.draft);
  }

  private validateAddress(): boolean {
    const errors: Record<string, string> = {};
    const { firstName, lastName, phone, email, city, address, postalCode } = this.draft;

    if (!firstName.trim()) errors['firstName'] = 'نام الزامی است.';
    if (!lastName.trim()) errors['lastName'] = 'نام خانوادگی الزامی است.';
    if (!/^09\d{9}$/.test(phone.trim())) {
      errors['phone'] = 'شماره موبایل معتبر (۰۹xxxxxxxxx) وارد کنید.';
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errors['email'] = 'ایمیل معتبر وارد کنید.';
    }
    if (!city.trim()) errors['city'] = 'شهر الزامی است.';
    if (!address.trim()) errors['address'] = 'آدرس کامل الزامی است.';
    if (!/^\d{10}$/.test(postalCode.trim())) {
      errors['postalCode'] = 'کد پستی ۱۰ رقمی وارد کنید.';
    }

    this.addressErrors = errors;
    return Object.keys(errors).length === 0;
  }
}
