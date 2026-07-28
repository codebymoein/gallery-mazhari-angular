import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
  ViewChild,
  inject
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  CONSULTATION_CONTACT_TIMES,
  CONSULTATION_TOPIC_OPTIONS,
  ConsultationFormPayload,
  ConsultationSource,
  ConsultationTopicOption
} from '@shared/data/consultation-options';
import {
  ConsultationService,
  ConsultationSubmitStatus
} from '@core/services/consultation.service';
import { ConsultationToastService } from '@core/services/consultation-toast.service';
import {
  JALALI_MONTHS,
  JALALI_WEEKDAYS,
  formatJalaliDisplay,
  isoToJalali,
  jalaliMonthLength,
  jalaliToIso,
  jalaliWeekdayIndex,
  todayJalali
} from '@shared/utils/jalali';

const PERSIAN_DIGIT_MAP: Record<string, string> = {
  '۰': '0', '۱': '1', '۲': '2', '۳': '3', '۴': '4',
  '۵': '5', '۶': '6', '۷': '7', '۸': '8', '۹': '9'
};

/** Keep only digits (Persian → Latin) for mobile validation. */
export function normalizePhoneDigits(value: string): string {
  return value
    .trim()
    .replace(/[۰-۹]/g, d => PERSIAN_DIGIT_MAP[d] ?? d)
    .replace(/\D/g, '');
}

export function isValidIranMobile(value: string): boolean {
  return normalizePhoneDigits(value).length === 11;
}

interface CalendarCell {
  jd: number;
  iso: string;
  disabled: boolean;
  selected: boolean;
  today: boolean;
  empty?: boolean;
}

@Component({
  selector: 'app-consultation-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './consultation-form.component.html',
  styleUrls: ['./consultation-form.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ConsultationFormComponent implements OnInit, OnChanges {
  private readonly consultation = inject(ConsultationService);
  private readonly toast = inject(ConsultationToastService);
  private readonly cdr = inject(ChangeDetectorRef);

  @Input() source: ConsultationSource = 'website';
  @Input() productId = '';
  @Input() productName = '';

  @Output() completed = new EventEmitter<void>();

  @ViewChild('stepHeading') stepHeading?: ElementRef<HTMLElement>;

  readonly contactTimes = CONSULTATION_CONTACT_TIMES;
  readonly timeKeys = Object.keys(CONSULTATION_CONTACT_TIMES);
  readonly topicOptions: readonly ConsultationTopicOption[] = CONSULTATION_TOPIC_OPTIONS;
  readonly weekdays = JALALI_WEEKDAYS;

  /** True when a specific product was passed in (product CTA flow). */
  lockedProduct = false;

  currentStep = 1;
  stepAnnouncement = '';

  /** Selected topic id for the main consultation form. */
  selectedTopicId = '';
  ceremonyDate = '';
  displayCeremonyDate = '';
  message = '';
  lastName = '';
  phone = '';
  contactTime = 'anytime';
  consent = false;
  honeypot = '';

  viewYear = todayJalali().jy;
  viewMonth = todayJalali().jm;
  cells: CalendarCell[] = [];
  private readonly minDate = jalaliToIso(todayJalali().jy, todayJalali().jm, todayJalali().jd);
  private readonly maxDate = jalaliToIso(todayJalali().jy + 3, 12, 29);

  submitting = false;
  noticeType: 'error' | null = null;
  noticeMessage = '';
  phoneError = '';

  ngOnInit(): void {
    this.syncLockedProduct();
    this.rebuildCalendar();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['productName'] || changes['productId']) {
      this.syncLockedProduct();
    }
  }

  private syncLockedProduct(): void {
    this.lockedProduct = !!this.productName.trim();
    if (this.lockedProduct) {
      this.selectedTopicId = '';
    }
    this.cdr.markForCheck();
  }

  get selectedTopicLabel(): string {
    return this.topicOptions.find(t => t.id === this.selectedTopicId)?.label ?? '';
  }

  get resolvedProductName(): string {
    return this.lockedProduct ? this.productName.trim() : this.selectedTopicLabel;
  }

  get resolvedProductId(): string {
    return this.lockedProduct ? this.productId.trim() : this.selectedTopicId;
  }

  get monthTitle(): string {
    const year = this.viewYear.toLocaleString('fa-IR', { useGrouping: false });
    return `${JALALI_MONTHS[this.viewMonth - 1]} ${year}`;
  }

  get progressItems(): { step: number; label: string }[] {
    return [
      { step: 1, label: 'انتخاب' },
      { step: 2, label: 'تماس' },
      { step: 3, label: 'تأیید' }
    ];
  }

  isStepComplete(step: number): boolean {
    return this.currentStep > step;
  }

  nextStep(): void {
    if (!this.validateStep(this.currentStep)) {
      if (this.currentStep === 2) {
        this.updatePhoneError();
      }
      return;
    }
    this.phoneError = '';
    if (this.currentStep < 3) {
      this.goToStep(this.currentStep + 1);
    }
  }

  prevStep(): void {
    if (this.currentStep > 1) {
      this.goToStep(this.currentStep - 1);
    }
  }

  goToStep(step: number): void {
    this.currentStep = step;
    const announcements: Record<number, string> = {
      1: 'مرحله ۱ از ۳: انتخاب و مراسم',
      2: 'مرحله ۲ از ۳: اطلاعات تماس',
      3: 'مرحله ۳ از ۳: تأیید درخواست'
    };
    this.stepAnnouncement = announcements[step] ?? '';
    this.cdr.markForCheck();
    queueMicrotask(() => this.stepHeading?.nativeElement.focus());
  }

  selectDay(cell: CalendarCell): void {
    if (cell.empty || cell.disabled) {
      return;
    }
    this.ceremonyDate = cell.iso;
    const j = isoToJalali(cell.iso);
    this.displayCeremonyDate = j ? formatJalaliDisplay(j.jy, j.jm, j.jd) : '';
    this.rebuildCalendar();
  }

  prevMonth(): void {
    if (this.viewMonth === 1) {
      this.viewMonth = 12;
      this.viewYear -= 1;
    } else {
      this.viewMonth -= 1;
    }
    this.rebuildCalendar();
  }

  nextMonth(): void {
    if (this.viewMonth === 12) {
      this.viewMonth = 1;
      this.viewYear += 1;
    } else {
      this.viewMonth += 1;
    }
    this.rebuildCalendar();
  }

  faDay(day: number): string {
    return day.toLocaleString('fa-IR');
  }

  onSubmit(event: Event): void {
    event.preventDefault();
    if (this.submitting) {
      return;
    }

    if (!this.validateStep(1) || !this.validateStep(2) || !this.validateStep(3)) {
      if ((!this.lockedProduct && !this.selectedTopicId) || !this.ceremonyDate || !this.messageIsValid()) {
        this.goToStep(1);
      } else if (!this.contactFieldsValid()) {
        this.updatePhoneError();
        this.goToStep(2);
      } else {
        this.goToStep(3);
      }
      return;
    }

    const productName = this.resolvedProductName;
    const productId = this.resolvedProductId;

    const payload: ConsultationFormPayload = {
      last_name: this.lastName,
      phone: this.phone,
      ceremony_date: this.ceremonyDate,
      contact_time: this.contactTime,
      message: this.message,
      consent: this.consent,
      consultation_source: this.source,
      product_name: productName || undefined,
      product_id: productId || undefined,
      website: this.honeypot
    };

    this.submitting = true;
    this.clearNotice();
    this.cdr.markForCheck();

    this.consultation.submit(payload).subscribe({
      next: status => {
        this.submitting = false;
        if (status === 'success') {
          this.toast.show(this.consultation.messageFor('success'));
          this.completed.emit();
          return;
        }
        this.showNotice(status);
        this.cdr.markForCheck();
      },
      error: (status: ConsultationSubmitStatus) => {
        this.submitting = false;
        this.showNotice(status);
        this.cdr.markForCheck();
      }
    });
  }

  private validateStep(step: number): boolean {
    if (step === 1) {
      const topicOk = this.lockedProduct || !!this.selectedTopicId;
      return topicOk && !!this.ceremonyDate && this.messageIsValid();
    }
    if (step === 2) {
      return this.contactFieldsValid();
    }
    if (step === 3) {
      return this.consent;
    }
    return true;
  }

  private contactFieldsValid(): boolean {
    const nameLen = this.lastName.trim().length;
    return (
      nameLen >= 2 &&
      nameLen <= 80 &&
      isValidIranMobile(this.phone) &&
      !!this.contactTime
    );
  }

  private updatePhoneError(): void {
    const nameLen = this.lastName.trim().length;
    if (nameLen < 2 || nameLen > 80) {
      this.phoneError = '';
      this.cdr.markForCheck();
      return;
    }
    if (!isValidIranMobile(this.phone)) {
      this.phoneError = 'شماره موبایل اشتباه است؛ باید ۱۱ رقم باشد.';
    } else {
      this.phoneError = '';
    }
    this.cdr.markForCheck();
  }

  onPhoneInput(): void {
    if (this.phoneError) {
      this.updatePhoneError();
    }
  }

  private messageIsValid(): boolean {
    return this.message.length <= 800;
  }

  private showNotice(status: ConsultationSubmitStatus): void {
    this.noticeType = 'error';
    this.noticeMessage = this.consultation.messageFor(status);
  }

  private clearNotice(): void {
    this.noticeType = null;
    this.noticeMessage = '';
  }

  private rebuildCalendar(): void {
    const today = todayJalali();
    const length = jalaliMonthLength(this.viewYear, this.viewMonth);
    const startWeekday = jalaliWeekdayIndex(this.viewYear, this.viewMonth, 1);
    const next: CalendarCell[] = [];

    for (let i = 0; i < startWeekday; i++) {
      next.push({ jd: 0, iso: '', disabled: true, selected: false, today: false, empty: true });
    }

    for (let jd = 1; jd <= length; jd++) {
      const iso = jalaliToIso(this.viewYear, this.viewMonth, jd);
      next.push({
        jd,
        iso,
        disabled: iso < this.minDate || iso > this.maxDate,
        selected: iso === this.ceremonyDate,
        today: this.viewYear === today.jy && this.viewMonth === today.jm && jd === today.jd
      });
    }

    this.cells = next;
    this.cdr.markForCheck();
  }
}
