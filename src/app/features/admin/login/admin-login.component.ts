import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  inject
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AdminAuthService } from '@core/services/admin-auth.service';

@Component({
  selector: 'app-admin-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './admin-login.component.html',
  styleUrls: ['./admin-login.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdminLoginComponent {
  private readonly auth = inject(AdminAuthService);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);

  username = '';
  password = '';
  error = '';
  submitting = false;
  showPassword = false;

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
