import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { CustomRequestApiService, CustomRequestType } from '@core/services/custom-request-api.service';
import { JALALI_MONTHS, JALALI_WEEKDAYS, formatJalaliDisplay, isoToJalali, jalaliMonthLength, jalaliToIso, jalaliWeekdayIndex, todayJalali } from '@shared/utils/jalali';

interface CalendarCell { jd: number; iso: string; disabled: boolean; selected: boolean; today: boolean; empty?: boolean; }

@Component({
  selector: 'app-custom-request', standalone: true, imports: [FormsModule, RouterLink],
  templateUrl: './custom-request.component.html',
  styleUrls: ['../../shared/components/consultation-form/consultation-form.component.css', './custom-request.component.css']
})
export class CustomRequestComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly api = inject(CustomRequestApiService);
  type: CustomRequestType = 'veil';
  model = { fullName: '', phone: '', email: '', city: '', ceremonyDate: '', contactTime: 'anytime', preferredContact: 'phone', modelTitle: '', description: '', color: '', fabric: '', sizeOrLength: '', budget: '', website: '' };
  files: File[] = [];
  previews: string[] = [];
  submitting = false;
  success = false;
  error = '';
  currentStep = 1;
  consent = false;
  readonly progressItems = [{ step: 1, label: 'مدل و مراسم' }, { step: 2, label: 'اطلاعات تماس' }, { step: 3, label: 'جزئیات و تصاویر' }];
  readonly weekdays = JALALI_WEEKDAYS;
  viewYear = todayJalali().jy;
  viewMonth = todayJalali().jm;
  cells: CalendarCell[] = [];
  displayCeremonyDate = '';
  private readonly minDate = jalaliToIso(todayJalali().jy, todayJalali().jm, todayJalali().jd);
  private readonly maxDate = jalaliToIso(todayJalali().jy + 3, 12, 29);

  get title(): string { return this.type === 'veil' ? 'درخواست تور سر سفارشی' : 'درخواست لباس سفارشی'; }
  get sizeLabel(): string { return this.type === 'veil' ? 'طول و عرض تقریبی تور' : 'سایز یا اندازه‌های اصلی'; }
  get monthTitle(): string { return `${JALALI_MONTHS[this.viewMonth - 1]} ${this.viewYear.toLocaleString('fa-IR', { useGrouping: false })}`; }
  get introDescription(): string {
    return this.type === 'veil'
      ? 'تور سر شما با بهترین کیفیت و متریال، همراه با کار دست حرفه‌ای اجرا می‌شود. با سال‌ها تجربه‌ای که داریم خیالتان راحت باشد؛ تکمیل فرم کمتر از دو دقیقه زمان می‌برد و مشاوران ما برای هماهنگی با شما تماس می‌گیرند.'
      : 'لباس سفارشی شما با بهترین کیفیت پارچه و متریال، همراه با دوخت و کار دست حرفه‌ای اجرا می‌شود. با سال‌ها تجربه‌ای که داریم خیالتان راحت باشد؛ تکمیل فرم کمتر از دو دقیقه زمان می‌برد و مشاوران ما برای هماهنگی با شما تماس می‌گیرند.';
  }
  get stepAnnouncement(): string { return `مرحله ${this.currentStep.toLocaleString('fa-IR')} از ۳: ${this.progressItems[this.currentStep - 1].label}`; }

  isStepComplete(step: number): boolean { return step < this.currentStep; }
  nextStep(): void {
    this.error = '';
    this.currentStep = Math.min(3, this.currentStep + 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  prevStep(): void { this.error = ''; this.currentStep = Math.max(1, this.currentStep - 1); }

  ngOnInit(): void { this.type = this.route.snapshot.paramMap.get('type') === 'dress' ? 'dress' : 'veil'; this.rebuildCalendar(); }

  selectDay(cell: CalendarCell): void { if (cell.empty || cell.disabled) return; this.model.ceremonyDate = cell.iso; const j = isoToJalali(cell.iso); this.displayCeremonyDate = j ? formatJalaliDisplay(j.jy, j.jm, j.jd) : ''; this.rebuildCalendar(); }
  prevMonth(): void { if (this.viewMonth === 1) { this.viewMonth = 12; this.viewYear--; } else this.viewMonth--; this.rebuildCalendar(); }
  nextMonth(): void { if (this.viewMonth === 12) { this.viewMonth = 1; this.viewYear++; } else this.viewMonth++; this.rebuildCalendar(); }
  faDay(day: number): string { return day.toLocaleString('fa-IR'); }

  selectImages(event: Event): void {
    const input = event.target as HTMLInputElement;
    const selected = Array.from(input.files || [])
      .filter(file => file.size <= 5 * 1024 * 1024 && ['image/jpeg', 'image/png', 'image/webp'].includes(file.type))
      .slice(0, 5);
    this.clearPreviews();
    this.files = selected;
    this.previews = selected.map(file => URL.createObjectURL(file));
    this.error = '';
  }

  submit(): void {
    this.error = '';
    const phone = this.model.phone.replace(/[۰-۹]/g, digit => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(digit))).replace(/\D/g, '');
    if (!/^09\d{9}$/.test(phone)) { this.error = 'شماره موبایل اشتباه است؛ شماره را به‌صورت 09xxxxxxxxx وارد کنید.'; return; }
    const data = new FormData();
    data.append('type', this.type);
    this.model.phone = phone;
    const compatibleModel = {
      ...this.model,
      fullName: this.model.fullName.trim() || 'ثبت نشده',
      ceremonyDate: this.model.ceremonyDate || new Date().toISOString().slice(0, 10),
      contactTime: this.model.contactTime || 'anytime',
      preferredContact: this.model.preferredContact || 'phone',
      modelTitle: this.model.modelTitle.trim() || (this.type === 'veil' ? 'تور سر سفارشی' : 'لباس سفارشی'),
      description: this.model.description.trim() || 'بدون توضیحات تکمیلی'
    };
    for (const [key, value] of Object.entries(compatibleModel)) if (value) data.append(key, value.trim());
    for (const file of this.files) data.append('images', file, file.name);
    this.submitting = true;
    this.api.create(data).pipe(finalize(() => this.submitting = false)).subscribe({
      next: () => { this.success = true; window.scrollTo({ top: 0, behavior: 'smooth' }); },
      error: () => { this.error = 'ثبت درخواست انجام نشد. لطفاً اطلاعات و حجم تصاویر را بررسی و دوباره تلاش کنید.'; }
    });
  }

  ngOnDestroy(): void { this.clearPreviews(); }
  private clearPreviews(): void { for (const url of this.previews) URL.revokeObjectURL(url); this.previews = []; }
  private rebuildCalendar(): void {
    const today = todayJalali(); const length = jalaliMonthLength(this.viewYear, this.viewMonth); const start = jalaliWeekdayIndex(this.viewYear, this.viewMonth, 1); const next: CalendarCell[] = [];
    for (let i = 0; i < start; i++) next.push({ jd: 0, iso: '', disabled: true, selected: false, today: false, empty: true });
    for (let jd = 1; jd <= length; jd++) { const iso = jalaliToIso(this.viewYear, this.viewMonth, jd); next.push({ jd, iso, disabled: iso < this.minDate || iso > this.maxDate, selected: iso === this.model.ceremonyDate, today: this.viewYear === today.jy && this.viewMonth === today.jm && jd === today.jd }); }
    this.cells = next;
  }
}
