import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '@env/environment';
import { AdminActivityService } from '@core/services/admin-activity.service';
import { AdminRole, AdminSessionUser } from '@shared/models/staging-product.model';
import { firstValueFrom, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { BackendApiService } from './backend-api.service';

interface AdminAccount {
  username: string;
  password: string;
  displayName: string;
  role: AdminRole;
}

@Injectable({ providedIn: 'root' })
export class AdminAuthService {
  private readonly storageKey = environment.storageKeys.adminSession;
  private readonly activity = inject(AdminActivityService);
  private readonly http = inject(HttpClient);
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

    // Primary path: new Nest backend auth.
    try {
      const response = await firstValueFrom(
        this.backendApi.login({
          email: normalized,
          password
        })
      );

      if (response.user.role !== 'admin') {
        return { ok: false, message: 'این حساب دسترسی ادمین ندارد.' };
      }

      const session: AdminSessionUser = {
        username: response.user.email,
        displayName: response.user.email,
        role: 'manager',
        accessToken: response.accessToken,
        backendUserRole: response.user.role
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
      // Fallback to legacy local/wordpress admin users.
    }

    const accounts = await this.loadAccounts();
    const account = accounts.find(
      (a) => a.username.toLowerCase() === normalized && a.password === password
    );

    if (!account) {
      return { ok: false, message: 'نام کاربری یا رمز عبور نادرست است.' };
    }

    const session: AdminSessionUser = {
      username: account.username,
      displayName: account.displayName,
      role: account.role
    };

    this.persist(session);
    this.sessionSignal.set(session);
    this.activity.log({
      action: 'login',
      actor: session.username,
      actorRole: session.role,
      summary: `${session.displayName} وارد پنل شد (Legacy)`
    });
    return { ok: true };
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
  }

  hasRole(roles: AdminRole[]): boolean {
    const current = this.sessionSignal();
    return !!current && roles.includes(current.role);
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

  private async loadAccounts(): Promise<AdminAccount[]> {
    try {
      const remote = await firstValueFrom(
        this.http
          .get<AdminAccount[]>(`${environment.apiBaseUrl}${environment.apiPath}/mazhari/v1/admin-users`)
          .pipe(catchError(() => of([] as AdminAccount[])))
      );
      if (Array.isArray(remote) && remote.length) {
        return remote;
      }
    } catch {
      // ignore and fallback
    }

    // Fallback: persisted users (configured by backend bootstrap/import process)
    try {
      const raw = localStorage.getItem('mazhariAdminUsers');
      if (!raw) return [];
      const parsed = JSON.parse(raw) as AdminAccount[];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
}
