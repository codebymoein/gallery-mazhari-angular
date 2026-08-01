import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { BackendApiService } from '@core/services/backend-api.service';

@Component({
  selector: 'app-admin-reset-password', standalone: true, imports: [FormsModule, RouterLink],
  templateUrl: './admin-reset-password.component.html', styleUrls: ['./admin-reset-password.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminResetPasswordComponent {
  private readonly api = inject(BackendApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly cdr = inject(ChangeDetectorRef);
  password = ''; confirmPassword = ''; submitting = false; success = ''; error = '';
  async submit(): Promise<void> {
    this.error = ''; this.success = '';
    const token = this.route.snapshot.queryParamMap.get('token') || '';
    if (!token) { this.error = 'لینک بازیابی نامعتبر است.'; return; }
    if (this.password.length < 12) { this.error = 'رمز جدید باید حداقل ۱۲ نویسه باشد.'; return; }
    if (this.password !== this.confirmPassword) { this.error = 'تکرار رمز عبور مطابقت ندارد.'; return; }
    this.submitting = true; this.cdr.markForCheck();
    try { await firstValueFrom(this.api.resetPassword(token, this.password)); this.success = 'رمز عبور تغییر کرد. اکنون می‌توانید وارد شوید.'; this.password = ''; this.confirmPassword = ''; }
    catch { this.error = 'لینک منقضی، مصرف‌شده یا نامعتبر است.'; }
    finally { this.submitting = false; this.cdr.markForCheck(); }
  }
}
