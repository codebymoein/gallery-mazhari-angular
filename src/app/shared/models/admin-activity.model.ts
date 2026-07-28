/**
 * Admin activity / audit log for manager oversight.
 */

export type AdminActivityAction =
  | 'login'
  | 'logout'
  | 'import'
  | 'photo_attach'
  | 'publish'
  | 'status_override';

export interface AdminActivityEntry {
  id: string;
  action: AdminActivityAction;
  actor: string;
  actorRole: string;
  summary: string;
  entityCode?: string;
  createdAt: string;
}

export const ADMIN_ACTIVITY_LABELS: Record<AdminActivityAction, string> = {
  login: 'ورود به پنل',
  logout: 'خروج از پنل',
  import: 'بارگذاری اکسل',
  photo_attach: 'ثبت عکس محصول',
  publish: 'انتشار روی سایت',
  status_override: 'تغییر وضعیت'
};
