import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  computed,
  inject,
  signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  CdkDragDrop,
  DragDropModule,
  moveItemInArray
} from '@angular/cdk/drag-drop';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AdminOrdersService } from '@core/services/admin-orders.service';
import {
  BridalOrder,
  BridalOrderStage,
  ORDER_STAGE_LABELS,
  ORDER_STAGES
} from '@shared/models/admin-enterprise.model';
import { formatFaDate, formatToman } from '../shared/admin-format';

@Component({
  selector: 'app-orders-kanban',
  standalone: true,
  imports: [CommonModule, DragDropModule, RouterLink, FormsModule],
  templateUrl: './orders-kanban.component.html',
  styleUrls: ['./orders-kanban.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class OrdersKanbanComponent {
  readonly ordersService = inject(AdminOrdersService);
  private readonly cdr = inject(ChangeDetectorRef);

  readonly stages = ORDER_STAGES;
  readonly labels = ORDER_STAGE_LABELS;
  readonly byStage = this.ordersService.byStage;
  readonly selected = signal<BridalOrder | null>(null);
  readonly checkedIds = signal<Set<string>>(new Set());
  readonly bulkStage = signal<BridalOrderStage>('fitting');
  readonly toast = signal('');
  private dragMoved = false;

  readonly formatToman = formatToman;
  readonly formatFaDate = formatFaDate;

  readonly checkedCount = computed(() => this.checkedIds().size);

  dropListIds(): string[] {
    return this.stages.map((s) => `stage-${s}`);
  }

  isChecked(id: string): boolean {
    return this.checkedIds().has(id);
  }

  toggleCheck(id: string, checked: boolean, event?: Event): void {
    event?.stopPropagation();
    const next = new Set(this.checkedIds());
    if (checked) next.add(id);
    else next.delete(id);
    this.checkedIds.set(next);
  }

  clearSelection(): void {
    this.checkedIds.set(new Set());
  }

  applyBulkStage(): void {
    const ids = [...this.checkedIds()];
    if (!ids.length) return;
    const stage = this.bulkStage();
    const n = this.ordersService.bulkMoveToStage(ids, stage);
    this.clearSelection();
    this.showToast(`${n} سفارش به «${this.labels[stage]}» منتقل شد.`);
  }

  onDrop(event: CdkDragDrop<BridalOrder[]>, stage: BridalOrderStage): void {
    this.dragMoved = true;
    const order = event.item.data as BridalOrder;
    if (event.previousContainer !== event.container && order) {
      this.ordersService.moveToStage(order.id, stage);
      const fresh = this.ordersService.getById(order.id);
      if (this.selected()?.id === order.id && fresh) {
        this.selected.set(fresh);
      }
      this.showToast(`سفارش ${order.orderNo} به «${this.labels[stage]}» منتقل شد.`);
    } else if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    }
    window.setTimeout(() => {
      this.dragMoved = false;
    }, 120);
    this.cdr.markForCheck();
  }

  open(order: BridalOrder): void {
    if (this.dragMoved) return;
    this.selected.set(this.ordersService.getById(order.id) || order);
  }

  close(): void {
    this.selected.set(null);
  }

  paymentLabel(status: string): string {
    const map: Record<string, string> = {
      paid: 'پرداخت‌شده',
      partial: 'پیش‌پرداخت',
      pending: 'در انتظار پرداخت',
      refunded: 'مسترد'
    };
    return map[status] || status;
  }

  stageHint(stage: BridalOrderStage): string {
    const hints: Record<BridalOrderStage, string> = {
      new: 'ثبت اولیه',
      fitting: 'زمان‌بندی پرو',
      tailoring: 'دوخت و اصلاح',
      ready: 'آماده شعبه',
      delivered: 'تکمیل‌شده'
    };
    return hints[stage];
  }

  exportPdf(): void {
    const order = this.selected();
    if (!order) return;

    const lines = order.lines
      .map(
        (l) =>
          `${l.name} (${l.productCode}) × ${l.qty} = ${formatToman(l.unitPrice * l.qty)}`
      )
      .join('\n');

    const addr = order.shippingAddress;
    const body = [
      '══════════════════════════════════',
      '   گالری مظهری — فاکتور سفارش',
      '══════════════════════════════════',
      `شماره: ${order.orderNo}`,
      `مرحله: ${this.labels[order.stage]}`,
      `مشتری: ${order.customerName}`,
      `موبایل: ${order.customerPhone}`,
      addr
        ? `آدرس: ${addr.city}، ${addr.address} — ${addr.postalCode}`
        : '',
      `وضعیت پرداخت: ${this.paymentLabel(order.paymentStatus)}`,
      `جمع: ${formatToman(order.total)}`,
      `پرداخت‌شده: ${formatToman(order.paidAmount)}`,
      `مانده: ${formatToman(order.total - order.paidAmount)}`,
      '',
      'اقلام:',
      lines,
      '',
      order.notes ? `یادداشت: ${order.notes}` : '',
      `تاریخ صدور: ${formatFaDate(new Date().toISOString())}`
    ]
      .filter(Boolean)
      .join('\n');

    this.downloadText(body, `${order.orderNo}-invoice.txt`);
    this.showToast(`فاکتور ${order.orderNo} دانلود شد.`);
  }

  exportShippingLabel(order?: BridalOrder | null): void {
    const target = order || this.selected();
    if (!target) return;
    const body = this.ordersService.buildShippingLabel(target);
    this.downloadText(body, `${target.orderNo}-shipping-label.txt`);
    this.showToast(`لیبل ارسال ${target.orderNo} دانلود شد.`);
  }

  private downloadText(body: string, filename: string): void {
    const url = URL.createObjectURL(new Blob([body], { type: 'text/plain;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  private showToast(message: string): void {
    this.toast.set(message);
    this.cdr.markForCheck();
    window.setTimeout(() => {
      if (this.toast() === message) {
        this.toast.set('');
        this.cdr.markForCheck();
      }
    }, 3200);
  }
}
