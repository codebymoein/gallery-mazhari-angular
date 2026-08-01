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
  readonly bulkStage = signal<BridalOrderStage>('ready');
  readonly toast = signal('');
  readonly monthFilter = signal('all');
  private dragMoved = false;

  readonly formatToman = formatToman;
  readonly formatFaDate = formatFaDate;

  readonly checkedCount = computed(() => this.checkedIds().size);
  readonly monthOptions = computed(() => {
    const months = new Map<string, string>();
    for (const order of this.ordersService.orders()) months.set(this.monthKey(order.createdAt), this.monthLabel(order.createdAt));
    return [...months].map(([value, label]) => ({ value, label }));
  });

  stageOrders(stage: BridalOrderStage): BridalOrder[] {
    const month = this.monthFilter();
    return this.byStage()[stage].filter(order => month === 'all' || this.monthKey(order.createdAt) === month);
  }

  visibleOrderCount(): number { return this.stages.reduce((sum, stage) => sum + this.stageOrders(stage).length, 0); }

  private monthKey(iso: string): string { const parts = new Intl.DateTimeFormat('en-US-u-ca-persian', { year: 'numeric', month: '2-digit' }).formatToParts(new Date(iso)); return `${parts.find(part => part.type === 'year')?.value}-${parts.find(part => part.type === 'month')?.value}`; }
  private monthLabel(iso: string): string { return new Intl.DateTimeFormat('fa-IR-u-ca-persian', { year: 'numeric', month: 'long' }).format(new Date(iso)); }

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

  selectAll(): void {
    this.checkedIds.set(new Set(this.ordersService.orders().map(order => order.id)));
  }

  selectedOrders(): BridalOrder[] {
    const ids = this.checkedIds();
    return this.ordersService.orders().filter(order => ids.has(order.id));
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
    this.printInvoices([order]);
  }

  exportShippingLabel(order?: BridalOrder | null): void {
    const target = order || this.selected();
    if (!target) return;
    this.printShippingLabels([target]);
  }

  exportSelectedInvoices(): void {
    const orders = this.selectedOrders();
    if (!orders.length) return;
    this.printInvoices(orders);
  }

  exportSelectedLabels(): void {
    const orders = this.selectedOrders();
    if (!orders.length) return;
    this.printShippingLabels(orders);
  }

  private printInvoices(orders: BridalOrder[]): void {
    const issuedAt = formatFaDate(new Date().toISOString());
    const pages = orders.map(order => {
      const address = order.shippingAddress;
      const rows = order.lines.map((line, index) => `
        <tr>
          <td>${index + 1}</td>
          <td dir="ltr">${this.escapeHtml(line.productCode)}</td>
          <td>${this.escapeHtml(line.name)}</td>
          <td>${line.qty.toLocaleString('fa-IR')}</td>
          <td>${this.escapeHtml(formatToman(line.unitPrice))}</td>
          <td>${this.escapeHtml(formatToman(line.unitPrice * line.qty))}</td>
        </tr>`).join('');

      return `<main class="invoice page">
        <header class="document-head">
          <div>
            <p class="brand">گالری مظهری</p>
            <h1>فاکتور فروش</h1>
          </div>
          <dl class="document-meta">
            <div><dt>شماره سفارش</dt><dd dir="ltr">${this.escapeHtml(order.orderNo)}</dd></div>
            <div><dt>تاریخ صدور</dt><dd>${this.escapeHtml(issuedAt)}</dd></div>
            <div><dt>وضعیت</dt><dd>${this.escapeHtml(this.labels[order.stage])}</dd></div>
          </dl>
        </header>
        <section class="party-grid">
          <div class="party">
            <h2>فروشنده</h2>
            <strong>گالری مظهری</strong>
            <p>${this.escapeHtml(this.ordersService.senderAddress)}</p>
          </div>
          <div class="party">
            <h2>خریدار / گیرنده</h2>
            <strong>${this.escapeHtml(address?.fullName || order.customerName)}</strong>
            <p>شماره تماس: <bdo dir="ltr">${this.escapeHtml(address?.phone || order.customerPhone)}</bdo></p>
            <p>نشانی: ${this.escapeHtml(address ? `${address.city}، ${address.address}` : 'در سفارش ثبت نشده')}</p>
            <p>کد پستی: <bdo dir="ltr">${this.escapeHtml(address?.postalCode || '—')}</bdo></p>
          </div>
        </section>
        <table class="items">
          <thead><tr><th>ردیف</th><th>کد کالا</th><th>شرح کالا</th><th>تعداد</th><th>مبلغ واحد</th><th>مبلغ کل</th></tr></thead>
          <tbody>${rows || '<tr><td colspan="6">قلمی ثبت نشده است</td></tr>'}</tbody>
        </table>
        <section class="invoice-bottom">
          <div class="notes">
            <h2>توضیحات</h2>
            <p>${this.escapeHtml(order.notes || '—')}</p>
          </div>
          <dl class="totals">
            <div><dt>جمع فاکتور</dt><dd>${this.escapeHtml(formatToman(order.total))}</dd></div>
            <div><dt>پرداخت‌شده</dt><dd>${this.escapeHtml(formatToman(order.paidAmount))}</dd></div>
            <div class="balance"><dt>مانده</dt><dd>${this.escapeHtml(formatToman(Math.max(0, order.total - order.paidAmount)))}</dd></div>
            <div><dt>وضعیت پرداخت</dt><dd>${this.escapeHtml(this.paymentLabel(order.paymentStatus))}</dd></div>
          </dl>
        </section>
        <footer class="signatures"><span>مهر و امضای فروشنده</span><span>امضای خریدار</span></footer>
      </main>`;
    }).join('');

    this.openPrintDocument('فاکتور سفارش‌ها', pages, this.invoiceStyles());
    this.showToast(`${orders.length.toLocaleString('fa-IR')} فاکتور برای چاپ آماده شد.`);
  }

  private printShippingLabels(orders: BridalOrder[]): void {
    const labels = orders.map(order => {
      const address = order.shippingAddress;
      return `<article class="shipping-label">
        <header>
          <strong>گالری مظهری</strong>
          <span>شماره سفارش: <bdo dir="ltr">${this.escapeHtml(order.orderNo)}</bdo></span>
        </header>
        <section class="sender">
          <h2>فرستنده</h2>
          <p>${this.escapeHtml(this.ordersService.senderAddress)}</p>
        </section>
        <section class="receiver">
          <h2>گیرنده</h2>
          <strong>${this.escapeHtml(address?.fullName || order.customerName)}</strong>
          <p>${this.escapeHtml(address ? `${address.city}، ${address.address}` : 'نشانی در سفارش ثبت نشده')}</p>
          <dl>
            <div><dt>کد پستی</dt><dd dir="ltr">${this.escapeHtml(address?.postalCode || '—')}</dd></div>
            <div><dt>تلفن</dt><dd dir="ltr">${this.escapeHtml(address?.phone || order.customerPhone)}</dd></div>
          </dl>
        </section>
      </article>`;
    }).join('');

    this.openPrintDocument(
      'برگه آدرس سفارش‌ها',
      `<main class="label-sheet">${labels}</main>`,
      this.labelStyles()
    );
    this.showToast(`${orders.length.toLocaleString('fa-IR')} برگه آدرس برای چاپ آماده شد.`);
  }

  private openPrintDocument(title: string, body: string, styles: string): void {
    const printWindow = window.open('', '_blank', 'width=1000,height=900');
    if (!printWindow) {
      this.showToast('مرورگر پنجره چاپ را مسدود کرده است؛ Pop-up را مجاز کنید.');
      return;
    }
    printWindow.document.open();
    printWindow.document.write(`<!doctype html><html lang="fa" dir="rtl"><head>
      <meta charset="utf-8"><title>${this.escapeHtml(title)}</title>
      <style>${styles}</style></head><body>${body}
      <script>window.addEventListener('load',function(){setTimeout(function(){window.print()},180)});</script>
      </body></html>`);
    printWindow.document.close();
  }

  private invoiceStyles(): string {
    return `
      @page{size:A4 portrait;margin:0}*{box-sizing:border-box}
      html,body{margin:0;background:#fff;color:#171717;font-family:Tahoma,Arial,sans-serif;direction:rtl}
      .page{width:190mm;height:277mm;margin:10mm;padding:10mm;border:1.2px solid #222;break-after:page;page-break-after:always;overflow:hidden}
      .page:last-child{break-after:auto;page-break-after:auto}.document-head{display:flex;justify-content:space-between;gap:12mm;padding-bottom:6mm;border-bottom:2px solid #9c7b2d}
      .brand{margin:0;color:#8b6b20;font-size:13pt;font-weight:700}.document-head h1{margin:2mm 0 0;font-size:23pt}
      .document-meta{display:grid;gap:1.5mm;margin:0;min-width:65mm}.document-meta div,.totals div{display:flex;justify-content:space-between;gap:6mm}.document-meta dt{color:#666;font-size:9pt}.document-meta dd{margin:0;font-size:10pt;font-weight:700}
      .party-grid{display:grid;grid-template-columns:1fr 1fr;gap:4mm;margin:6mm 0}.party{min-height:39mm;padding:4mm;border:1px solid #777}.party h2,.notes h2{margin:0 0 2.5mm;color:#755b1c;font-size:10pt}.party strong{font-size:11pt}.party p{margin:1.5mm 0;font-size:9pt;line-height:1.8}
      .items{width:100%;border-collapse:collapse;table-layout:fixed;font-size:9pt}.items th,.items td{padding:3mm 2mm;border:1px solid #555;text-align:center;overflow-wrap:anywhere}.items th{background:#f2eee4}.items th:nth-child(3),.items td:nth-child(3){width:31%;text-align:right}
      .invoice-bottom{display:grid;grid-template-columns:1fr 72mm;gap:5mm;margin-top:6mm}.notes{min-height:42mm;padding:4mm;border:1px solid #777}.notes p{margin:0;font-size:9pt;line-height:1.9;white-space:pre-wrap}
      .totals{margin:0;border:1px solid #555}.totals div{padding:3mm;border-bottom:1px solid #aaa;font-size:9pt}.totals div:last-child{border-bottom:0}.totals dd{margin:0;font-weight:700}.totals .balance{background:#f2eee4;font-size:10pt}
      .signatures{display:flex;justify-content:space-between;margin-top:18mm;padding:0 12mm;font-size:9pt;font-weight:700}
    `;
  }

  private labelStyles(): string {
    return `
      @page{size:A5 landscape;margin:5mm}*{box-sizing:border-box}
      html,body{margin:0;background:#fff;color:#111;font-family:Tahoma,Arial,sans-serif;direction:rtl}
      .label-sheet{display:block;margin:0}
      .shipping-label{display:grid;grid-template-rows:auto 43mm 1fr;width:200mm;height:138mm;border:1.6px solid #111;break-after:page;page-break-after:always;break-inside:avoid;page-break-inside:avoid;overflow:hidden}
      .shipping-label:last-child{break-after:auto;page-break-after:auto}
      .shipping-label header{display:flex;justify-content:space-between;align-items:center;gap:5mm;padding:4mm 6mm;background:#f2eee4;border-bottom:1.2px solid #333;font-size:11pt}
      .shipping-label header strong{font-size:16pt}.shipping-label section{padding:5mm 7mm}.shipping-label h2{margin:0 0 2mm;color:#765b1d;font-size:11pt}.shipping-label p{margin:0;font-size:11pt;line-height:1.9;overflow-wrap:anywhere}
      .sender{border-bottom:1.2px dashed #555}.receiver{display:grid;grid-template-columns:32mm 1fr;grid-template-rows:auto 1fr auto;column-gap:5mm}
      .receiver h2{grid-column:1/-1}.receiver>strong{grid-column:1;grid-row:2;display:block;font-size:16pt;line-height:1.8}.receiver>p{grid-column:2;grid-row:2;font-size:13pt;font-weight:700;line-height:1.9}
      .receiver dl{grid-column:1/-1;display:grid;grid-template-columns:1fr 1fr;gap:5mm;margin:3mm 0 0}.receiver dl div{display:flex;justify-content:space-between;align-items:center;gap:3mm;padding:2.5mm 4mm;border:1px solid #999}.receiver dt{font-size:9pt;color:#555}.receiver dd{margin:0;font-size:13pt;font-weight:700}
    `;
  }

  private escapeHtml(value: unknown): string {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
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
