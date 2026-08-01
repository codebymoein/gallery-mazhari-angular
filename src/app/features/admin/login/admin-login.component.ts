import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  inject
} from '@angular/core';

import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AdminAuthService } from '@core/services/admin-auth.service';
import { BackendApiService } from '@core/services/backend-api.service';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-admin-login',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './admin-login.component.html',
  styleUrls: ['./admin-login.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdminLoginComponent {
  private readonly auth = inject(AdminAuthService);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly backend = inject(BackendApiService);

  username = '';
  password = '';
  error = '';
  submitting = false;
  showPassword = false;
  recoveryOpen = false;
  recoveryEmail = '';
  recoveryMessage = '';
  recoverySubmitting = false;

  async requestRecovery(): Promise<void> {
    if (!this.recoveryEmail.trim()) return;
    this.recoverySubmitting = true; this.error = ''; this.recoveryMessage = ''; this.cdr.markForCheck();
    try {
      await firstValueFrom(this.backend.forgotPassword(this.recoveryEmail.trim()));
      this.recoveryMessage = 'اگر حساب معتبر باشد، لینک امن بازیابی به ایمیل ثبت‌شده ارسال شد.';
    } catch (error: unknown) {
      const detail = (error as { error?: { message?: string } })?.error?.message;
      this.error = detail === 'smtp_not_configured' ? 'ارسال ایمیل هنوز روی سرور پیکربندی نشده است.' : 'ارسال لینک بازیابی انجام نشد.';
    } finally { this.recoverySubmitting = false; this.cdr.markForCheck(); }
  }

  fillDemo(role: 'staff' | 'manager' | 'admin'): void {
    if (role === 'staff') {
      this.username = 'staff';
      this.password = 'staff123';
    } else if (role === 'admin') {
      this.username = 'admin';
      this.password = 'admin123';
    } else {
      this.username = 'manager';
      this.password = 'manager123';
    }
    this.error = '';
    this.cdr.markForCheck();
  }

  async submit(): Promise<void> {
    this.error = '';
    this.submitting = true;
    this.cdr.markForCheck();

    const result = await this.auth.login(this.username, this.password);
    this.submitting = false;

    if (!result.ok) {
      this.error = result.message;
      this.cdr.markForCheck();
      return;
    }

    void this.router.navigateByUrl('/admin/dashboard');
  }
}
