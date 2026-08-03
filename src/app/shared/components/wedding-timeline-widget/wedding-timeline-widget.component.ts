import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  HostListener,
  OnDestroy,
  ViewChild,
  inject
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, NavigationEnd } from '@angular/router';
import { Subscription, filter } from 'rxjs';
import { WeddingTimelineService } from '@core/services/wedding-timeline.service';
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

interface CalendarCell {
  jd: number;
  iso: string;
  disabled: boolean;
  selected: boolean;
  today: boolean;
  empty?: boolean;
}

@Component({
  selector: 'app-wedding-timeline-widget',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './wedding-timeline-widget.component.html',
  styleUrls: ['./wedding-timeline-widget.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class WeddingTimelineWidgetComponent implements AfterViewInit, OnDestroy {
  readonly timeline = inject(WeddingTimelineService);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);

  @ViewChild('dialogEl') dialogEl?: ElementRef<HTMLDialogElement>;
  @ViewChild('triggerBtn') triggerBtn?: ElementRef<HTMLButtonElement>;

  dateValue = '';
  consented = false;
  hiddenOnRoute = false;
  dockVisible = false;
  triggerText = 'برنامه‌ریزی مراسم';
  displayDate = '';
  statusMessage = '';
  statusIsError = false;

  readonly weekdays = JALALI_WEEKDAYS;
  viewYear = todayJalali().jy;
  viewMonth = todayJalali().jm;
  cells: CalendarCell[] = [];

  private routeSub: Subscription;
  private openSub?: Subscription;
  private stateSub: Subscription;
  private viewReady = false;

  readonly minDate = this.timeline.minDate();
  readonly maxDate = this.timeline.maxDate();

  constructor() {
    this.hiddenOnRoute = this.isSensitiveRoute(this.router.url);
    this.syncFormFromState();
    this.rebuildCalendar();
    this.updateDockVisibility();

    this.routeSub = this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe((event) => {
        this.hiddenOnRoute = this.isSensitiveRoute(event.urlAfterRedirects);
        if (this.hiddenOnRoute) {
          this.timeline.close();
        }
        this.updateDockVisibility();
        this.cdr.markForCheck();
      });

    this.stateSub = this.timeline.state$.subscribe((state) => {
      this.triggerText = this.timeline.triggerLabel();
      if (state.date) {
        this.dateValue = state.date;
        this.consented = true;
        this.syncDisplayFromIso(state.date);
        const j = isoToJalali(state.date);
        if (j) {
          this.viewYear = j.jy;
          this.viewMonth = j.jm;
          this.rebuildCalendar();
        }
      }
      this.cdr.markForCheck();
    });

  }

  ngAfterViewInit(): void {
    this.viewReady = true;
    this.openSub = this.timeline.isOpen$.subscribe((open) => {
      this.syncDialog(open);
      this.cdr.markForCheck();
    });
    this.syncDialog(this.timeline.isOpen());
  }

  ngOnDestroy(): void {
    this.routeSub.unsubscribe();
    this.openSub?.unsubscribe();
    this.stateSub.unsubscribe();
  }

  get monthTitle(): string {
    const year = this.viewYear.toLocaleString('fa-IR', { useGrouping: false });
    return `${JALALI_MONTHS[this.viewMonth - 1]} ${year}`;
  }

  open(): void {
    this.syncFormFromState();
    this.rebuildCalendar();
    this.timeline.open();
  }

  close(): void {
    this.timeline.dismissAutoPrompt();
  }

  onDialogClose(): void {
    if (this.timeline.isOpen()) {
      this.timeline.dismissAutoPrompt();
    }
  }

  onDialogBackdrop(event: MouseEvent): void {
    // Native <dialog> backdrop click: target is the dialog itself, not its children.
    if (event.target === this.dialogEl?.nativeElement) {
      this.close();
    }
  }

  save(): void {
    if (!this.dateValue) {
      this.setStatus('اول یک روز را از تقویم انتخاب کنید.', true);
      return;
    }

    if (!this.consented) {
      this.setStatus('برای ذخیره، تیک رضایت ذخیره روی مرورگر را بزنید.', true);
      return;
    }

    const ok = this.timeline.save(this.dateValue, this.consented);
    if (ok) {
      this.setStatus('تاریخ مراسم روی همین مرورگر ذخیره شد.', false);
      this.triggerText = this.timeline.triggerLabel();
      this.cdr.markForCheck();
      // Close after a short beat so the user sees the success state on the trigger.
      setTimeout(() => this.timeline.close(), 350);
      return;
    }

    this.setStatus(this.timeline.latestStatus || 'ذخیره انجام نشد. دوباره تلاش کنید.', true);
    this.cdr.markForCheck();
  }

  remove(): void {
    this.timeline.remove();
    this.dateValue = '';
    this.displayDate = '';
    this.consented = false;
    this.triggerText = this.timeline.triggerLabel();
    this.setStatus('تاریخ ذخیره‌شده از این مرورگر حذف شد.', false);
    this.rebuildCalendar();
  }

  onConsentChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.consented = input.checked;
    if (this.statusIsError) {
      this.statusMessage = '';
      this.statusIsError = false;
    }
    this.cdr.markForCheck();
  }

  selectDay(cell: CalendarCell): void {
    if (cell.empty || cell.disabled) {
      return;
    }
    this.dateValue = cell.iso;
    this.syncDisplayFromIso(cell.iso);
    if (this.statusIsError) {
      this.statusMessage = '';
      this.statusIsError = false;
    }
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

  private setStatus(message: string, isError: boolean): void {
    this.statusMessage = message;
    this.statusIsError = isError;
    this.cdr.markForCheck();
  }

  @HostListener('window:scroll')
  onScroll(): void {
    this.updateDockVisibility();
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.timeline.isOpen()) {
      this.close();
    }
  }

  private syncDialog(open: boolean): void {
    if (!this.viewReady) {
      return;
    }
    const dialog = this.dialogEl?.nativeElement;
    if (!dialog) {
      return;
    }
    if (open && !dialog.open) {
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
      this.triggerBtn?.nativeElement.focus();
    }
  }

  private syncFormFromState(): void {
    const state = this.timeline.state;
    this.dateValue = state.date || '';
    this.consented = state.personalized;
    this.triggerText = this.timeline.triggerLabel();
    if (state.date) {
      this.syncDisplayFromIso(state.date);
    } else {
      this.displayDate = '';
    }
  }

  private syncDisplayFromIso(iso: string): void {
    const j = isoToJalali(iso);
    this.displayDate = j ? formatJalaliDisplay(j.jy, j.jm, j.jd) : '';
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
        selected: iso === this.dateValue,
        today: this.viewYear === today.jy && this.viewMonth === today.jm && jd === today.jd
      });
    }

    this.cells = next;
    this.cdr.markForCheck();
  }

  private updateDockVisibility(): void {
    const onHome = this.router.url === '/' || this.router.url.startsWith('/?');
    // On home (mobile-first): wait until user leaves the first hero viewport.
    this.dockVisible = !onHome || window.scrollY > window.innerHeight * 0.55;
    this.cdr.markForCheck();
  }

  private isSensitiveRoute(url: string): boolean {
    return /^\/(cart|account)(\/|$)/.test(url);
  }
}
