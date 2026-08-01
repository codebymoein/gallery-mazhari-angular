import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnInit,
  inject
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
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
import { PaymentApiService, PaymentSettings } from '@core/services/payment-api.service';
import { finalize } from 'rxjs/operators';

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
  private readonly route = inject(ActivatedRoute);
  private readonly payments = inject(PaymentApiService);
  private retryOrder: LocalOrder | null = null;

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
  paymentSettings: PaymentSettings = {
    enabled: false,
    provider: 'disabled',
    displayName: 'پرداخت آنلاین',
    sandbox: false
  };
  paymentBusy = false;
  paymentError = '';
  paymentResult: { status: string; order: string; ref: string } | null = null;

  readonly shippingOptions: Array<{
    value: CheckoutDraft['shippingMethod'];
    title: string;
    desc: string;
  }> = [
    {
      value: 'standard',
      title: 'پست پیشتاز',
      desc: 'ارسال با پست پیشتاز به سراسر کشور'
    },
    {
      value: 'express',
      title: 'تیپاکس',
      desc: 'پس‌کرایه؛ هزینه هنگام تحویل توسط مشتری پرداخت می‌شود'
    },
    {
      value: 'pickup',
      title: 'پیک سریع',
      desc: 'هزینه پیک مستقیماً توسط مشتری پرداخت می‌شود'
    }
  ];

  readonly onImgError = onImgErrorUseFallback;

  ngOnInit(): void {
    const paymentStatus = this.route.snapshot.queryParamMap.get('payment');
    if (paymentStatus) {
      this.paymentResult = {
        status: paymentStatus,
        order: this.route.snapshot.queryParamMap.get('order') || '',
        ref: this.route.snapshot.queryParamMap.get('ref') || ''
      };
      if (this.paymentResult.order) {
        const callbackOrder = this.orders.getOrderById(this.paymentResult.order);
        if (callbackOrder) this.orders.refreshOrder(callbackOrder).subscribe({
          next: remote => {
            if (remote.paymentStatus === 'paid') {
              this.cart.clearCart();
              this.orders.clearDraft();
            }
            this.paymentResult = {
              status: remote.paymentStatus,
              order: remote.number,
              ref: this.paymentResult?.ref || ''
            };
            this.cdr.markForCheck();
          },
          error: () => {
            this.paymentError = 'تأیید وضعیت پرداخت انجام نشد؛ از بخش پیگیری سفارش دوباره بررسی کنید.';
            this.cdr.markForCheck();
          }
        });
      }
    }
    this.payments.publicSettings().subscribe({
      next: value => {
        this.paymentSettings = value;
        this.cdr.markForCheck();
      },
      error: () => {
        this.paymentSettings.enabled = false;
        this.cdr.markForCheck();
      }
    });
    const orderId = this.route.snapshot.queryParamMap.get('order');
    const pendingOrder = orderId ? this.orders.getOrderById(orderId) : undefined;
    if (pendingOrder?.status === 'pending-payment') {
      this.retryOrder = pendingOrder;
      this.draft = {
        step: 3,
        firstName: pendingOrder.customer.firstName,
        lastName: pendingOrder.customer.lastName,
        phone: pendingOrder.customer.phone,
        email: pendingOrder.customer.email,
        address: pendingOrder.customer.address,
        city: pendingOrder.customer.city,
        postalCode: pendingOrder.customer.postalCode,
        shippingMethod: this.shippingMethodFromLabel(pendingOrder.shippingMethod),
        paymentMethod: 'online',
        note: pendingOrder.note || ''
      };
      this.step = 3;
      return;
    }
    this.draft = this.orders.loadDraft();
    this.step = this.draft.step;
  }

  formatPrice(amount: number): string {
    return new Intl.NumberFormat('fa-IR').format(Math.round(amount)) + ' ریال';
  }

  shippingCost(): number {
    return this.orders.shippingCost(this.draft.shippingMethod);
  }

  shippingCostFor(method: CheckoutDraft['shippingMethod']): number {
    return this.orders.shippingCost(method);
  }

  shippingPriceLabel(method: CheckoutDraft['shippingMethod']): string {
    if (method === 'express') return 'پس‌کرایه';
    if (method === 'pickup') return 'هزینه با مشتری';
    return this.formatPrice(this.shippingCostFor(method));
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
      this.cart.emptyCart$.pipe(take(1))
    ])
      .pipe(map(([items, empty]) => ({ items, empty })))
      .subscribe(({ items, empty }) => {
        if (empty || items.length === 0) {
          return;
        }

        this.postOrderContinueLink = this.shoppingContext.continueShoppingLink(items);

        if (!this.paymentSettings.enabled) {
          this.paymentError = 'درگاه پرداخت در حال حاضر فعال نیست.';
          this.cdr.markForCheck();
          return;
        }
        const paymentItems = items.map(item => ({
          code: item.source_id || '',
          quantity: item.quantity,
          customization: item.engraving?.position === 'veil-print'
            ? 'veil-print' as const
            : item.engraving
              ? 'engraving' as const
              : undefined
        }));
        if (paymentItems.some(item => !item.code)) {
          this.paymentError = 'شناسه انباری یکی از کالاها معتبر نیست؛ آن را از سبد حذف و دوباره اضافه کنید.';
          this.cdr.markForCheck();
          return;
        }

        this.paymentBusy = true;
        this.paymentError = '';
        this.payments.createPayment({
          items: paymentItems,
          shippingMethod: this.draft.shippingMethod,
          customer: {
            firstName: this.draft.firstName,
            lastName: this.draft.lastName,
            phone: this.draft.phone,
            email: this.draft.email,
            city: this.draft.city,
            address: this.draft.address,
            postalCode: this.draft.postalCode
          },
          note: this.draft.note
        }).pipe(finalize(() => {
          this.paymentBusy = false;
          this.cdr.markForCheck();
        })).subscribe({
          next: payment => {
            const shipping = this.shippingCost();
            this.createdOrder = this.retryOrder || this.orders.createOrderFromCheckout(
              this.draft,
              items,
              {
                subtotal: Math.max(0, payment.amount - shipping),
                shipping,
                total: payment.amount
              },
              payment.orderNumber,
              payment.orderToken
            );
            window.location.assign(payment.redirectUrl);
          },
          error: err => {
            const message = err?.error?.message;
            this.paymentError = Array.isArray(message)
              ? message.join('، ')
              : message || 'ایجاد پرداخت انجام نشد. دوباره تلاش کنید.';
          }
        });
      });
  }

  private shippingMethodFromLabel(label: string): CheckoutDraft['shippingMethod'] {
    if (label.includes('تیپاکس')) return 'express';
    if (label.includes('پیک')) return 'pickup';
    return 'standard';
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
    const { lastName, phone, email, city, address, postalCode } = this.draft;

    if (!lastName.trim()) errors['lastName'] = 'نام خانوادگی الزامی است.';
    if (!/^09\d{9}$/.test(phone.trim())) {
      errors['phone'] = 'شماره موبایل معتبر (۰۹xxxxxxxxx) وارد کنید.';
    }
    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errors['email'] = 'ایمیل معتبر وارد کنید.';
    }
    if (!city.trim()) errors['city'] = 'شهر الزامی است.';
    if (!address.trim()) errors['address'] = 'آدرس کامل الزامی است.';
    if (postalCode.trim() && !/^\d{10}$/.test(postalCode.trim())) {
      errors['postalCode'] = 'کد پستی ۱۰ رقمی وارد کنید.';
    }

    this.addressErrors = errors;
    return Object.keys(errors).length === 0;
  }
}
