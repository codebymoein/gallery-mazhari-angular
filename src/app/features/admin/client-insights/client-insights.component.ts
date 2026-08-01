import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnInit,
  inject
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  CONSULTATION_FOLLOW_UP_LABELS,
  ConsultationFollowUpTag,
  ConsultationService,
  StoredConsultationRequest
} from '@core/services/consultation.service';
import { CONSULTATION_CONTACT_TIMES } from '@shared/data/consultation-options';

const FOLLOW_UP_OPTIONS = Object.entries(CONSULTATION_FOLLOW_UP_LABELS).map(
  ([value, label]) => ({ value: value as ConsultationFollowUpTag, label })
);

@Component({
  selector: 'app-client-insights',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './client-insights.component.html',
  styleUrls: ['./client-insights.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ClientInsightsComponent implements OnInit {
  private readonly consultation = inject(ConsultationService);
  private readonly cdr = inject(ChangeDetectorRef);

  readonly followUpOptions = FOLLOW_UP_OPTIONS;
  requests: StoredConsultationRequest[] = [];
  selectedIds = new Set<string>();
  toast = '';
  statusFilter: 'all' | ConsultationFollowUpTag | 'none' = 'all';
  monthFilter = 'all';

  ngOnInit(): void {
    this.loadData();
  }

  get filteredRequests(): StoredConsultationRequest[] {
    return this.requests.filter(request => {
      const statusOk =
        this.statusFilter === 'all' ||
        (this.statusFilter === 'none'
          ? !request.followUpTag
          : request.followUpTag === this.statusFilter);
      const monthOk =
        this.monthFilter === 'all' ||
        this.monthKey(request.created_at) === this.monthFilter;
      return statusOk && monthOk;
    });
  }

  get selectedRequests(): StoredConsultationRequest[] {
    return this.requests.filter(request => this.selectedIds.has(request.id));
  }

  get monthOptions(): Array<{ value: string; label: string }> {
    const map = new Map<string, string>();
    for (const request of this.requests) {
      map.set(this.monthKey(request.created_at), this.monthLabel(request.created_at));
    }
    return [...map].map(([value, label]) => ({ value, label }));
  }

  isSelected(id: string): boolean {
    return this.selectedIds.has(id);
  }

  toggleSelected(id: string, checked: boolean): void {
    const next = new Set(this.selectedIds);
    if (checked) {
      next.add(id);
    } else {
      next.delete(id);
    }
    this.selectedIds = next;
    this.cdr.markForCheck();
  }

  selectFiltered(): void {
    this.selectedIds = new Set(this.filteredRequests.map(request => request.id));
    this.showToast(
      `${this.selectedIds.size.toLocaleString('fa-IR')} درخواست مطابق فیلتر انتخاب شد.`
    );
  }

  clearSelection(): void {
    this.selectedIds = new Set();
    this.cdr.markForCheck();
  }

  deleteOne(request: StoredConsultationRequest): void {
    if (!window.confirm(`درخواست ${request.last_name} با شماره ${request.phone} حذف شود؟ این عملیات قابل بازگشت نیست.`)) {
      return;
    }
    const deleted = this.consultation.deleteRequests([request.id]);
    this.selectedIds.delete(request.id);
    this.loadData();
    if (deleted) this.showToast('درخواست مشاوره حذف شد.');
  }

  deleteSelected(): void {
    const count = this.selectedIds.size;
    if (!count) return;
    if (!window.confirm(`${count.toLocaleString('fa-IR')} درخواست انتخاب‌شده حذف شوند؟ این عملیات قابل بازگشت نیست.`)) {
      return;
    }
    const deleted = this.consultation.deleteRequests([...this.selectedIds]);
    this.selectedIds = new Set();
    this.loadData();
    this.showToast(`${deleted.toLocaleString('fa-IR')} درخواست حذف شد.`);
  }

  setTag(req: StoredConsultationRequest, tag: ConsultationFollowUpTag): void {
    this.consultation.setFollowUpTag(req.id, tag);
    this.loadData();
    this.showToast(
      `وضعیت «${CONSULTATION_FOLLOW_UP_LABELS[tag]}» برای ${req.last_name} ثبت شد.`
    );
  }

  saveNote(request: StoredConsultationRequest): void {
    this.consultation.setAdminNote(request.id, request.adminNote || '');
    this.showToast('یادداشت ادمین ذخیره شد.');
  }

  exportSelectedPdf(): void {
    const selected = this.selectedRequests;
    if (!selected.length) {
      this.showToast('ابتدا حداقل یک درخواست را انتخاب کنید.');
      return;
    }

    const printWindow = window.open('', '_blank', 'width=900,height=1100');
    if (!printWindow) {
      this.showToast('مرورگر پنجره چاپ را مسدود کرده است. Pop-up را مجاز کنید.');
      return;
    }

    const cardMarkup = (request: StoredConsultationRequest) => {
      const dreamItemsMarkup = request.dreamItems?.length
        ? `<ul class="dream-items">${request.dreamItems
            .map(item => `<li>${this.escapeHtml(item.name)}</li>`)
            .join('')}</ul>`
        : '<strong class="empty-value">ثبت نشده</strong>';

      return `
          <article class="request-card">
            <div class="field field--customer">
              <span class="label">اطلاعات مشتری</span>
              <strong>${this.escapeHtml(request.last_name)}</strong>
              <bdo dir="ltr">${this.escapeHtml(request.phone)}</bdo>
            </div>
            <div class="field">
              <span class="label">زمان درخواست تماس</span>
              <strong>${this.escapeHtml(this.contactTimeLabel(request.contact_time))}</strong>
            </div>
            <div class="field">
              <span class="label">تاریخ مراسم مشتری</span>
              <strong>${this.escapeHtml(this.formatCeremonyDate(request.ceremony_date))}</strong>
            </div>
            <div class="field">
              <span class="label">مدل یا دسته‌بندی درخواستی</span>
              <strong>${this.escapeHtml(request.product_name || '—')}</strong>
            </div>
            <div class="field field--wide">
              <span class="label">اقلام بوم رویایی مشتری</span>
              ${dreamItemsMarkup}
            </div>
            <div class="field field--wide field--result">
              <span class="label">نتیجه تماس / توضیح کوتاه مسئول</span>
              <strong>${this.escapeHtml(
                request.adminNote || '................................................................................................'
              )}</strong>
            </div>
          </article>
        `;
    };
    const sheets: string[] = [];
    for (let index = 0; index < selected.length; index += 2) {
      sheets.push(
        `<main class="sheet"><section class="requests">${selected
          .slice(index, index + 2)
          .map(cardMarkup)
          .join('')}</section></main>`
      );
    }

    printWindow.document.open();
    printWindow.document.write(`<!doctype html>
      <html lang="fa" dir="rtl">
        <head>
          <meta charset="utf-8">
          <title></title>
          <style>
            @page { size: A4 portrait; margin: 0; }
            * { box-sizing: border-box; }
            html, body {
              margin: 0;
              padding: 0;
              background: #fff;
              color: #111;
              font-family: Tahoma, Arial, sans-serif;
              direction: rtl;
            }
            .sheet {
              width: 190mm;
              height: 277mm;
              margin: 10mm;
              padding: 7mm;
              border: 1.4px solid #111;
              overflow: hidden;
              break-after: page;
              page-break-after: always;
            }
            .sheet:last-child { break-after: auto; page-break-after: auto; }
            .requests {
              display: grid;
              grid-template-rows: repeat(2, 1fr);
              gap: 5mm;
              height: 100%;
            }
            .request-card {
              display: grid;
              grid-template-columns: repeat(4, minmax(0, 1fr));
              grid-template-rows: auto minmax(30mm, 1fr) minmax(26mm, auto);
              min-height: 0;
              border: 1.2px solid #222;
              overflow: hidden;
              break-inside: avoid;
              page-break-inside: avoid;
            }
            .field {
              min-width: 0;
              display: flex;
              flex-direction: column;
              justify-content: center;
              gap: 3mm;
              padding: 6mm;
              border-inline-start: 1px solid #555;
              text-align: right;
              overflow-wrap: anywhere;
            }
            .field:first-child { border-inline-start: 0; }
            .field--wide {
              grid-column: 1 / -1;
              padding-block: 4mm;
              border-inline-start: 0;
              border-top: 1px solid #555;
              justify-content: flex-start;
            }
            .field--result { min-height: 26mm; }
            .label {
              color: #555;
              font-size: 9pt;
              font-weight: 700;
            }
            strong, bdo {
              display: block;
              font-size: 13pt;
              line-height: 1.8;
              font-weight: 700;
              overflow-wrap: anywhere;
            }
            bdo { font-size: 12pt; }
            .dream-items {
              display: flex;
              flex-wrap: wrap;
              align-content: flex-start;
              gap: 2mm 6mm;
              margin: 1mm 0 0;
              padding: 0 5mm 0 0;
              font-size: 10.5pt;
              line-height: 1.7;
              font-weight: 700;
            }
            .dream-items li {
              flex: 0 1 calc(50% - 4mm);
              overflow-wrap: anywhere;
            }
            .empty-value { color: #444; font-size: 11pt; }
            @media print {
              html, body { width: 100%; }
              .sheet { height: 277mm; }
            }
          </style>
        </head>
        <body>
          ${sheets.join('')}
          <script>
            window.addEventListener('load', function () {
              window.setTimeout(function () { window.print(); }, 120);
            });
          </script>
        </body>
      </html>`);
    printWindow.document.close();
  }

  tagLabel(tag?: ConsultationFollowUpTag): string {
    return tag ? CONSULTATION_FOLLOW_UP_LABELS[tag] : 'بدون وضعیت';
  }

  contactTimeLabel(key: string): string {
    return CONSULTATION_CONTACT_TIMES[key] ?? key;
  }

  formatDate(iso: string): string {
    try {
      return new Intl.DateTimeFormat('fa-IR-u-ca-persian', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(new Date(iso));
    } catch {
      return iso;
    }
  }

  formatCeremonyDate(date: string): string {
    try {
      const [y, m, d] = date.split('-').map(Number);
      if (!y || !m || !d) return date;
      return new Intl.DateTimeFormat('fa-IR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }).format(new Date(y, m - 1, d));
    } catch {
      return date;
    }
  }

  private monthKey(iso: string): string {
    const parts = new Intl.DateTimeFormat('en-US-u-ca-persian', {
      year: 'numeric',
      month: '2-digit'
    }).formatToParts(new Date(iso));
    return `${parts.find(part => part.type === 'year')?.value}-${
      parts.find(part => part.type === 'month')?.value
    }`;
  }

  private monthLabel(iso: string): string {
    return new Intl.DateTimeFormat('fa-IR-u-ca-persian', {
      year: 'numeric',
      month: 'long'
    }).format(new Date(iso));
  }

  private loadData(): void {
    this.requests = this.consultation.getRequests();
    this.cdr.markForCheck();
    this.consultation.refreshFromServer().subscribe({
      next: requests => { this.requests = requests; this.cdr.markForCheck(); },
      error: () => { /* Keep the last local cache visible during a temporary outage. */ }
    });
  }

  private showToast(message: string): void {
    this.toast = message;
    this.cdr.markForCheck();
    window.setTimeout(() => {
      if (this.toast === message) {
        this.toast = '';
        this.cdr.markForCheck();
      }
    }, 2800);
  }

  private escapeHtml(value: string): string {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
}
