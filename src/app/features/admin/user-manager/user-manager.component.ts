import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { AdminAuthService } from '@core/services/admin-auth.service';
import { ManagedUser, ManagedUserInput, UserManagerService } from '@core/services/user-manager.service';

const PERMISSIONS = [
  { key: 'dashboard.view', label: 'مشاهده داشبورد' },
  { key: 'orders.manage', label: 'مدیریت سفارش‌ها' },
  { key: 'crm.manage', label: 'مدیریت مشتریان CRM' },
  { key: 'inventory.manage', label: 'مدیریت انبار و کالا' },
  { key: 'publishing.queue.manage', label: 'مدیریت صف انتشار' },
  { key: 'publishing.published.manage', label: 'مدیریت محصولات منتشرشده' },
  { key: 'marketing.manage', label: 'مدیریت بازاریابی' },
  { key: 'consultation.manage', label: 'مدیریت مشاوره‌ها' },
  { key: 'catalog.view', label: 'مشاهده کاتالوگ' },
  { key: 'orders.view', label: 'مشاهده سفارش‌ها' },
  { key: 'orders.create', label: 'ثبت سفارش' },
  { key: 'profile.edit', label: 'ویرایش پروفایل' },
  { key: 'pricing.view', label: 'مشاهده قیمت‌ها' },
  { key: 'downloads.access', label: 'دریافت فایل‌ها' }
];

@Component({
  selector: 'app-user-manager',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './user-manager.component.html',
  styleUrls: ['./user-manager.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UserManagerComponent implements OnInit {
  private readonly api = inject(UserManagerService);
  private readonly auth = inject(AdminAuthService);
  private readonly cdr = inject(ChangeDetectorRef);
  readonly permissionOptions = PERMISSIONS;
  users: ManagedUser[] = [];
  loading = false;
  saving = false;
  error = '';
  notice = '';
  query = '';
  editingId: string | null = null;
  showForm = false;
  form: ManagedUserInput = this.emptyForm();
  password = '';
  me = { fullName: this.auth.user()?.displayName || '', email: this.auth.user()?.username || '', password: '' };

  ngOnInit() { this.load(); }
  get filteredUsers() {
    const q = this.query.trim().toLowerCase();
    return !q ? this.users : this.users.filter(u => `${u.fullName} ${u.email}`.toLowerCase().includes(q));
  }
  openCreate() { this.editingId = null; this.form = this.emptyForm(); this.password = ''; this.showForm = true; }
  openEdit(user: ManagedUser) {
    this.editingId = user.id;
    this.form = { fullName: user.fullName, email: user.email, role: user.role, permissions: [...(user.permissions || [])], isActive: user.isActive };
    this.password = '';
    this.showForm = true;
  }
  togglePermission(key: string, checked: boolean) {
    this.form.permissions = checked ? [...this.form.permissions, key] : this.form.permissions.filter(p => p !== key);
  }
  save() {
    this.clearMessages();
    if (!this.form.fullName.trim() || !this.form.email.trim() || (!this.editingId && this.password.length < 6)) {
      this.error = 'نام، نام کاربری و رمز حداقل ۶ کاراکتری الزامی است.'; return;
    }
    this.saving = true;
    const payload = { ...this.form, ...(this.password ? { password: this.password } : {}) };
    const request = this.editingId ? this.api.update(this.editingId, payload) : this.api.create(payload as ManagedUserInput & { password: string });
    request.pipe(finalize(() => { this.saving = false; this.cdr.markForCheck(); })).subscribe({
      next: () => { this.notice = 'اطلاعات کاربر با موفقیت ذخیره شد.'; this.showForm = false; this.load(false); },
      error: err => { this.error = err?.error?.message || 'ذخیره کاربر انجام نشد.'; this.cdr.markForCheck(); }
    });
  }
  toggleActive(user: ManagedUser) {
    this.api.update(user.id, { isActive: !user.isActive }).subscribe({ next: () => this.load(false), error: () => { this.error = 'تغییر وضعیت انجام نشد.'; this.cdr.markForCheck(); } });
  }
  remove(user: ManagedUser) {
    if (!confirm(`حساب «${user.fullName}» حذف شود؟`)) return;
    this.api.remove(user.id).subscribe({ next: () => { this.notice = 'حساب حذف شد.'; this.load(false); }, error: e => { this.error = e?.error?.message || 'حذف حساب انجام نشد.'; this.cdr.markForCheck(); } });
  }
  saveMe() {
    this.clearMessages();
    if (this.me.password && this.me.password.length < 6) { this.error = 'رمز جدید باید حداقل ۶ کاراکتر باشد.'; return; }
    this.saving = true;
    this.api.updateMe({ fullName: this.me.fullName, email: this.me.email, ...(this.me.password ? { password: this.me.password } : {}) })
      .pipe(finalize(() => { this.saving = false; this.cdr.markForCheck(); }))
      .subscribe({ next: () => { this.me.password = ''; this.notice = 'اطلاعات حساب مدیر ذخیره شد؛ پس از تغییر نام کاربری دوباره وارد شوید.'; }, error: e => { this.error = e?.error?.message || 'تغییر حساب مدیر انجام نشد.'; } });
  }
  private load(showLoader = true) {
    if (showLoader) this.loading = true;
    this.api.list().pipe(finalize(() => { this.loading = false; this.cdr.markForCheck(); })).subscribe({ next: users => this.users = users, error: e => this.error = e?.error?.message || 'دریافت کاربران انجام نشد.' });
  }
  private emptyForm(): ManagedUserInput { return { fullName: '', email: '', role: 'customer', permissions: ['catalog.view', 'profile.edit'], isActive: true }; }
  private clearMessages() { this.error = ''; this.notice = ''; }
}
