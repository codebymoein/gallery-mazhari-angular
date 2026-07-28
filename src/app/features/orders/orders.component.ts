import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { LocalOrder, LocalOrderStatus, OrderService } from '@core/services/order.service';
import { ShoppingContextService } from '@core/services/shopping-context.service';
import { CartItem } from '@shared/models';

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './orders.component.html',
  styleUrls: ['./orders.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class OrdersComponent {
  private readonly orders = inject(OrderService);
  private readonly shoppingContext = inject(ShoppingContextService);
  private readonly cdr = inject(ChangeDetectorRef);

  readonly orders$ = this.orders.orders$;
  expandedOrderId: string | null = null;

  shopLink(): string[] {
    const latest = this.orders.getOrders()[0];
    if (latest?.items?.length) {
      return this.shoppingContext.continueShoppingLink(latest.items);
    }
    return this.shoppingContext.continueShoppingLink([]);
  }

  formatPrice(amount: number): string {
    return new Intl.NumberFormat('fa-IR').format(Math.round(amount)) + ' تومان';
  }

  formatDate(iso: string): string {
    return new Intl.DateTimeFormat('fa-IR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(iso));
  }

  statusLabel(status: LocalOrderStatus): string {
    return this.orders.statusLabel(status);
  }

  statusClass(status: LocalOrderStatus): string {
    switch (status) {
      case 'pending-payment':
        return 'orders__badge--pending';
      case 'processing':
        return 'orders__badge--processing';
      case 'shipped':
        return 'orders__badge--shipped';
      case 'completed':
        return 'orders__badge--completed';
      case 'cancelled':
        return 'orders__badge--cancelled';
      default:
        return '';
    }
  }

  toggleOrder(order: LocalOrder): void {
    this.expandedOrderId = this.expandedOrderId === order.id ? null : order.id;
    this.cdr.markForCheck();
  }

  isExpanded(order: LocalOrder): boolean {
    return this.expandedOrderId === order.id;
  }

  lineTotal(item: CartItem): number {
    return item.price * item.quantity;
  }

  customerName(order: LocalOrder): string {
    return `${order.customer.firstName} ${order.customer.lastName}`.trim();
  }

  trackByOrderId(_index: number, order: LocalOrder): string {
    return order.id;
  }

  trackByProductId(_index: number, item: CartItem): number {
    return item.product_id;
  }

  onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.hidden = true;
  }
}
