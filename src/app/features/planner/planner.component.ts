import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  afterNextRender,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { CustomerAuthService } from '@core/services/customer-auth.service';
import {
  CeremonyType,
  PlannerApiService,
  PlannerTaskView,
  WeddingPlannerView,
} from '@core/services/planner-api.service';

interface CeremonyOption {
  value: CeremonyType;
  label: string;
  note: string;
}

@Component({
  selector: 'app-planner',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './planner.component.html',
  styleUrl: './planner.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlannerComponent {
  readonly auth = inject(CustomerAuthService);
  private readonly api = inject(PlannerApiService);

  readonly loading = signal(true);
  readonly planner = signal<WeddingPlannerView | null>(null);
  readonly error = signal('');
  readonly status = signal('');
  readonly saving = signal(false);
  readonly authBusy = signal(false);
  readonly authMode = signal<'login' | 'register'>('login');
  readonly selectedCeremonies = signal<CeremonyType[]>([]);
  readonly eventDate = signal('');
  readonly fullName = signal('');
  readonly email = signal('');
  readonly password = signal('');
  readonly confirmReset = signal(false);

  readonly ceremonyOptions: readonly CeremonyOption[] = [
    { value: 'wedding', label: 'عروسی', note: 'مراسم اصلی و استایل کامل عروس' },
    { value: 'aghd', label: 'عقد', note: 'عقد محضری یا مراسم عقد' },
    { value: 'engagement', label: 'نامزدی', note: 'استایل و جزئیات مراسم نامزدی' },
    { value: 'bale-boroon', label: 'بله‌برون', note: 'جزئیات و ملزومات بله‌برون' },
    { value: 'formality', label: 'فرمالیته', note: 'استایل عکاسی و فرمالیته' },
  ];

  constructor() {
    afterNextRender(() => void this.initialize());
  }

  async submitAuth(): Promise<void> {
    this.error.set('');
    this.authBusy.set(true);
    const mode = this.authMode();
    const result =
      mode === 'login'
        ? await this.auth.login(this.email(), this.password())
        : await this.auth.register(this.fullName(), this.email(), this.password());
    this.authBusy.set(false);

    if (!result.ok) {
      this.error.set(result.message);
      return;
    }

    this.password.set('');
    await this.loadPlanner();
  }

  switchAuthMode(mode: 'login' | 'register'): void {
    this.authMode.set(mode);
    this.error.set('');
  }

  async logout(): Promise<void> {
    await this.auth.logout();
    this.planner.set(null);
    this.status.set('');
    this.error.set('');
  }

  toggleCeremony(type: CeremonyType): void {
    const next = new Set(this.selectedCeremonies());
    if (next.has(type)) next.delete(type);
    else next.add(type);
    this.selectedCeremonies.set([...next]);
  }

  ceremonySelected(type: CeremonyType): boolean {
    return this.selectedCeremonies().includes(type);
  }

  async saveSetup(): Promise<void> {
    if (!this.eventDate() || this.selectedCeremonies().length === 0) {
      this.error.set('حداقل یک نوع مراسم و تاریخ را انتخاب کنید.');
      return;
    }

    this.saving.set(true);
    this.error.set('');
    this.status.set('');
    try {
      const current = this.planner();
      const updated = await firstValueFrom(
        this.api.saveSetup({
          eventDate: this.eventDate(),
          ceremonyTypes: this.selectedCeremonies(),
          version: current?.version,
        }),
      );
      this.planner.set(updated);
      this.status.set(current ? 'برنامه مراسم به‌روز شد.' : 'برنامه مراسم شما ساخته شد.');
    } catch (error) {
      await this.handleMutationError(error, 'ذخیره برنامه انجام نشد.');
    } finally {
      this.saving.set(false);
    }
  }

  async toggleTask(task: PlannerTaskView): Promise<void> {
    const current = this.planner();
    if (!current || this.saving()) return;
    this.saving.set(true);
    this.error.set('');
    this.status.set('');
    try {
      const updated = await firstValueFrom(
        this.api.updateTask(task.id, !task.completed, current.version),
      );
      this.planner.set(updated);
      this.status.set(task.completed ? 'کار دوباره به برنامه برگشت.' : 'انجام این مرحله ثبت شد.');
    } catch (error) {
      await this.handleMutationError(error, 'به‌روزرسانی این مرحله انجام نشد.');
    } finally {
      this.saving.set(false);
    }
  }

  editSetup(): void {
    const current = this.planner();
    if (!current) return;
    this.eventDate.set(current.eventDate);
    this.selectedCeremonies.set([...current.ceremonyTypes]);
    document.getElementById('planner-setup')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  async resetPlanner(): Promise<void> {
    const current = this.planner();
    if (!current) return;
    if (!this.confirmReset()) {
      this.confirmReset.set(true);
      return;
    }

    this.saving.set(true);
    this.error.set('');
    try {
      await firstValueFrom(this.api.remove(current.version));
      this.planner.set(null);
      this.eventDate.set('');
      this.selectedCeremonies.set([]);
      this.confirmReset.set(false);
      this.status.set('برنامه حذف شد؛ هر زمان بخواهید می‌توانید از نو شروع کنید.');
    } catch (error) {
      await this.handleMutationError(error, 'حذف برنامه انجام نشد.');
    } finally {
      this.saving.set(false);
    }
  }

  cancelReset(): void {
    this.confirmReset.set(false);
  }

  tasksFor(group: PlannerTaskView['group']): PlannerTaskView[] {
    return this.planner()?.tasks.filter((task) => task.group === group) ?? [];
  }

  groupLabel(group: PlannerTaskView['group']): string {
    if (group === 'foundation') return 'شروع مسیر';
    if (group === 'style') return 'ساخت استایل';
    return 'روزهای آخر';
  }

  taskStatusLabel(task: PlannerTaskView): string {
    if (task.completed) return 'انجام شد';
    if (task.status === 'overdue') return 'زمان پیشنهادی گذشته';
    if (task.status === 'upcoming') return 'نزدیک است';
    return 'در ادامه';
  }

  actionLink(task: PlannerTaskView): string[] | null {
    if (!task.action) return null;
    if (task.action.kind === 'consultation') return ['/consultation'];
    return task.action.target === 'accessories' ? ['/accessories'] : ['/catalog'];
  }

  actionLabel(task: PlannerTaskView): string {
    if (task.action?.kind === 'consultation') return 'رزرو مشاوره';
    return task.action?.target === 'accessories' ? 'دیدن اکسسوری‌ها' : 'دیدن کالکشن';
  }

  formatDate(value: string): string {
    const [year, month, day] = value.split('-').map(Number);
    return new Intl.DateTimeFormat('fa-IR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(new Date(year, month - 1, day));
  }

  minDate(): string {
    return this.localIsoDate(new Date());
  }

  maxDate(): string {
    const date = new Date();
    date.setFullYear(date.getFullYear() + 3);
    return this.localIsoDate(date);
  }

  private async initialize(): Promise<void> {
    await this.auth.restore();
    if (this.auth.isAuthenticated()) await this.loadPlanner();
    this.loading.set(false);
  }

  private async loadPlanner(): Promise<void> {
    this.loading.set(true);
    this.error.set('');
    try {
      const planner = await firstValueFrom(this.api.getMine());
      this.planner.set(planner);
      if (planner) {
        this.eventDate.set(planner.eventDate);
        this.selectedCeremonies.set([...planner.ceremonyTypes]);
      }
    } catch (error) {
      const details = this.errorDetails(error);
      if (details.status === 401 || details.status === 403) {
        await this.auth.logout();
        this.planner.set(null);
      } else {
        this.error.set('دریافت برنامه ممکن نشد؛ دوباره تلاش کنید.');
      }
    } finally {
      this.loading.set(false);
    }
  }

  private async handleMutationError(error: unknown, fallback: string): Promise<void> {
    const details = this.errorDetails(error);
    if (details.serverCode === 'planner_version_conflict') {
      await this.loadPlanner();
      this.error.set('برنامه در جای دیگری تغییر کرده بود؛ آخرین نسخه بارگذاری شد.');
      return;
    }
    this.error.set(details.message || fallback);
  }

  private errorDetails(error: unknown): { status?: number; serverCode?: string; message?: string } {
    if (!error || typeof error !== 'object') return {};
    const value = error as {
      status?: number;
      message?: string;
      details?: { code?: string; message?: string | string[] };
    };
    const rawMessage = value.details?.message;
    return {
      status: value.status,
      serverCode: value.details?.code,
      message: Array.isArray(rawMessage) ? rawMessage[0] : rawMessage || value.message,
    };
  }

  private localIsoDate(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
}
