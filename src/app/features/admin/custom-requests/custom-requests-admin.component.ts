import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CustomRequestApiService, CustomRequestRecord, CustomRequestStatus, CustomRequestType } from '@core/services/custom-request-api.service';
import { formatJalaliDisplay, isoToJalali } from '@shared/utils/jalali';

@Component({ selector: 'app-custom-requests-admin', standalone: true, imports: [CommonModule, FormsModule], templateUrl: './custom-requests-admin.component.html', styleUrls: ['./custom-requests-admin.component.css'] })
export class CustomRequestsAdminComponent implements OnInit {
  private readonly api = inject(CustomRequestApiService);
  requests: CustomRequestRecord[] = [];
  filter: 'all' | CustomRequestType = 'all';
  monthFilter = 'all'; loading = true; error = '';
  readonly expanded = new Set<string>();
  readonly statuses: Array<{ value: CustomRequestStatus; label: string }> = [
    { value: 'new', label: 'جدید' }, { value: 'reviewing', label: 'در حال بررسی' }, { value: 'estimated', label: 'برآورد قیمت شد' }, { value: 'contacted', label: 'تماس گرفته شد' }, { value: 'cancelled', label: 'لغو شده' }
  ];
  get visible(): CustomRequestRecord[] { return this.requests.filter(item => (this.filter === 'all' || item.type === this.filter) && (this.monthFilter === 'all' || this.monthKey(item.createdAt) === this.monthFilter)); }
  get monthOptions(): Array<{ value: string; label: string }> { const months = new Map<string, string>(); for (const request of this.requests) months.set(this.monthKey(request.createdAt), this.monthLabel(request.createdAt)); return [...months].map(([value, label]) => ({ value, label })); }
  ngOnInit(): void { this.load(); }
  load(): void { this.loading = true; this.api.list().subscribe({ next: value => { this.requests = value; this.loading = false; }, error: () => { this.error = 'دریافت درخواست‌ها انجام نشد.'; this.loading = false; } }); }
  save(request: CustomRequestRecord): void { this.api.update(request.id, { status: request.status, adminNote: request.adminNote || '' }).subscribe({ next: saved => Object.assign(request, saved), error: () => this.error = 'ذخیره تغییرات انجام نشد.' }); }
  toggleDetails(id: string): void {
    if (this.expanded.has(id)) {
      this.expanded.delete(id);
    } else {
      this.expanded.add(id);
    }
  }
  isExpanded(id: string): boolean { return this.expanded.has(id); }
  printPdf(): void { window.print(); }
  jalaliDate(value?: string | null, withTime = false): string {
    if (!value) return '—';
    const date = new Date(value); if (Number.isNaN(date.getTime())) return value;
    const j = isoToJalali(date.toISOString().slice(0, 10)); if (!j) return value;
    const day = formatJalaliDisplay(j.jy, j.jm, j.jd);
    return withTime && value.includes('T') ? `${day} - ${date.toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })}` : day;
  }
  statusLabel(value: CustomRequestStatus): string { return this.statuses.find(item => item.value === value)?.label || value; }
  label(type: CustomRequestType): string { return type === 'veil' ? 'تور سر سفارشی' : type === 'home-trial' ? 'تست در محل تهران' : 'لباس سفارشی'; }
  contactTimeLabel(value: string): string { return ({ anytime: 'هر زمان', morning: 'صبح ۹ تا ۱۲', afternoon: 'ظهر ۱۲ تا ۱۶', evening: 'عصر ۱۶ تا ۲۰' } as Record<string, string>)[value] || value || '—'; }
  contactMethodLabel(value: string): string { return ({ phone: 'تماس تلفنی', whatsapp: 'واتساپ', telegram: 'تلگرام' } as Record<string, string>)[value] || value || '—'; }
  private monthKey(iso: string): string { const parts = new Intl.DateTimeFormat('en-US-u-ca-persian', { year: 'numeric', month: '2-digit' }).formatToParts(new Date(iso)); return `${parts.find(part => part.type === 'year')?.value}-${parts.find(part => part.type === 'month')?.value}`; }
  private monthLabel(iso: string): string { return new Intl.DateTimeFormat('fa-IR-u-ca-persian', { year: 'numeric', month: 'long' }).format(new Date(iso)); }
}
