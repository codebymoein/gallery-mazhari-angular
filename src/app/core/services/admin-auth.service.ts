import { Injectable, computed, inject, signal } from '@angular/core';
import { environment } from '@env/environment';
import { AdminActivityService } from '@core/services/admin-activity.service';
import { AdminRole, AdminSessionUser } from '@shared/models/staging-product.model';
import { firstValueFrom } from 'rxjs';
import { BackendApiService } from './backend-api.service';

@Injectable({ providedIn: 'root' })
export class AdminAuthService {
  private readonly storageKey = environment.storageKeys.adminSession;
  private readonly activity = inject(AdminActivityService);
  private readonly backendApi = inject(BackendApiService);

  private readonly sessionSignal = signal<AdminSessionUser | null>(this.readSession());

  readonly user = this.sessionSignal.asReadonly();
  readonly isAuthenticated = computed(() => this.sessionSignal() !== null);
  readonly isManager = computed(() => this.sessionSignal()?.role === 'manager');
  readonly isStaff = computed(() => {
    const role = this.sessionSignal()?.role;
    return role === 'staff' || role === 'manager';
  });

  async login(
    username: string,
    password: string
  ): Promise<{ ok: true } | { ok: false; message: string }> {
    const normalized = username.trim().toLowerCase();
    if (!normalized.includes('@')) {
      return { ok: false, message: 'ایمیل معتبر مدیر را وارد کنید.' };
    }
    const backendUsername = normalized;

    // Primary path: new Nest backend auth.
    try {
      const response = await firstValueFrom(
        this.backendApi.login({
          email: backendUsername,
          password
        })
      );

      if (response.user.role !== 'admin' && response.user.role !== 'staff') {
        return { ok: false, message: 'این حساب دسترسی ادمین ندارد.' };
      }

      const session: AdminSessionUser = {
        username: response.user.email,
        displayName: response.user.fullName || response.user.email,
        role: response.user.role === 'admin' ? 'manager' : 'staff',
        accessToken: response.accessToken,
        backendUserRole: response.user.role,
        permissions: response.user.permissions || []
      };

      this.persist(session);
      this.sessionSignal.set(session);
      this.activity.log({
        action: 'login',
        actor: session.username,
        actorRole: session.role,
        summary: `${session.displayName} وارد پنل شد (Backend)`
      });
      return { ok: true };
    } catch {
      return { ok: false, message: 'ورود سرور انجام نشد؛ نام کاربری، رمز و اتصال بک‌اند را بررسی کنید.' };
    }
  }

  logout(): void {
    const current = this.sessionSignal();
    if (current) {
      this.activity.log({
        action: 'logout',
        actor: current.username,
        actorRole: current.role,
        summary: `${current.displayName} از پنل خارج شد`
      });
    }
    try {
      sessionStorage.removeItem(this.storageKey);
    } catch {
      // Ignore storage errors.
    }
    this.sessionSignal.set(null);
    this.backendApi.logout().subscribe({ error: () => undefined });
  }

  hasRole(roles: AdminRole[]): boolean {
    const current = this.sessionSignal();
    return !!current && roles.includes(current.role);
  }

  hasPermission(permission: string): boolean {
    const current = this.sessionSignal();
    if (!current) return false;
    if (current.role === 'manager') return true;
    return (current.permissions || []).includes(permission);
  }

  private readSession(): AdminSessionUser | null {
    try {
      const raw = sessionStorage.getItem(this.storageKey);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as AdminSessionUser;
      if (!parsed?.username || !parsed?.role) return null;
      if (parsed.role !== 'staff' && parsed.role !== 'manager') return null;
      return parsed;
    } catch {
      return null;
    }
  }

  private persist(session: AdminSessionUser): void {
    try {
      sessionStorage.setItem(this.storageKey, JSON.stringify(session));
    } catch {
      // Ignore storage errors.
    }
  }

}
