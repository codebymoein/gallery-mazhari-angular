import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { environment } from '@env/environment';
import { firstValueFrom } from 'rxjs';

export interface CustomerSessionUser {
  userId: string;
  email: string;
  role: 'customer';
  permissions: string[];
  fullName?: string;
}

type AuthResult = { ok: true } | { ok: false; message: string };

@Injectable({ providedIn: 'root' })
export class CustomerAuthService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.backendApiBaseUrl;
  private readonly userSignal = signal<CustomerSessionUser | null>(null);
  private readonly resolvedSignal = signal(false);

  readonly user = this.userSignal.asReadonly();
  readonly resolved = this.resolvedSignal.asReadonly();
  readonly isAuthenticated = computed(() => this.userSignal() !== null);

  async restore(): Promise<void> {
    if (this.resolvedSignal()) return;
    try {
      const profile = await firstValueFrom(
        this.http.get<{
          userId: string;
          email: string;
          role: string;
          permissions?: string[];
          fullName?: string;
        }>(`${this.baseUrl}/auth/profile`),
      );
      if (profile.role === 'customer') {
        this.userSignal.set({
          userId: profile.userId,
          email: profile.email,
          role: 'customer',
          permissions: profile.permissions ?? [],
          fullName: profile.fullName,
        });
      }
    } catch {
      this.userSignal.set(null);
    } finally {
      this.resolvedSignal.set(true);
    }
  }

  async login(email: string, password: string): Promise<AuthResult> {
    try {
      const response = await firstValueFrom(
        this.http.post<{
          user: { id: string; email: string; role: string; fullName?: string; permissions?: string[] };
        }>(`${this.baseUrl}/auth/login`, { email: email.trim().toLowerCase(), password }),
      );
      if (response.user.role !== 'customer') {
        await this.logout();
        return { ok: false, message: 'این حساب برای پنل مشتری نیست.' };
      }
      this.userSignal.set({
        userId: response.user.id,
        email: response.user.email,
        role: 'customer',
        permissions: response.user.permissions ?? [],
        fullName: response.user.fullName,
      });
      this.resolvedSignal.set(true);
      return { ok: true };
    } catch {
      return { ok: false, message: 'ایمیل یا رمز عبور صحیح نیست.' };
    }
  }

  async register(fullName: string, email: string, password: string): Promise<AuthResult> {
    try {
      const response = await firstValueFrom(
        this.http.post<{
          user: { id: string; email: string; role: string; fullName?: string; permissions?: string[] };
        }>(`${this.baseUrl}/auth/register`, {
          fullName: fullName.trim(),
          email: email.trim().toLowerCase(),
          password,
        }),
      );
      if (response.user.role !== 'customer') {
        return { ok: false, message: 'ثبت‌نام مشتری تکمیل نشد.' };
      }
      this.userSignal.set({
        userId: response.user.id,
        email: response.user.email,
        role: 'customer',
        permissions: response.user.permissions ?? [],
        fullName: response.user.fullName,
      });
      this.resolvedSignal.set(true);
      return { ok: true };
    } catch (error) {
      const message = this.errorMessage(error);
      return { ok: false, message };
    }
  }

  async logout(): Promise<void> {
    try {
      await firstValueFrom(this.http.post(`${this.baseUrl}/auth/logout`, {}));
    } catch {
      // Clear local presentation state even when network logout cannot complete.
    }
    this.userSignal.set(null);
    this.resolvedSignal.set(true);
  }

  private errorMessage(error: unknown): string {
    if (!error || typeof error !== 'object') return 'ثبت‌نام انجام نشد.';
    const candidate = error as { details?: { message?: string | string[] }; message?: string };
    const detail = candidate.details?.message;
    if (Array.isArray(detail)) return detail[0] ?? 'اطلاعات ثبت‌نام معتبر نیست.';
    if (typeof detail === 'string') return detail;
    return candidate.message || 'ثبت‌نام انجام نشد.';
  }
}
