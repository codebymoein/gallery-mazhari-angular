import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AdminAuthService } from '@core/services/admin-auth.service';
import { AdminRole } from '@shared/models/staging-product.model';

/**
 * Requires an authenticated admin/staff/manager session.
 */
export const adminAuthGuard: CanActivateFn = () => {
  const auth = inject(AdminAuthService);
  const router = inject(Router);

  if (auth.isAuthenticated()) {
    return true;
  }

  return router.createUrlTree(['/admin/login']);
};

/**
 * Restricts a route to the Manager (owner) role.
 */
export const managerRoleGuard: CanActivateFn = () => {
  const auth = inject(AdminAuthService);
  const router = inject(Router);

  if (!auth.isAuthenticated()) {
    return router.createUrlTree(['/admin/login']);
  }

  if (auth.hasRole(['manager'])) {
    return true;
  }

  return router.createUrlTree(['/admin/staging']);
};

/**
 * Allows any of the given roles (staff and/or manager).
 */
export function adminRoleGuard(roles: AdminRole[]): CanActivateFn {
  return () => {
    const auth = inject(AdminAuthService);
    const router = inject(Router);

    if (!auth.isAuthenticated()) {
      return router.createUrlTree(['/admin/login']);
    }

    if (auth.hasRole(roles)) {
      return true;
    }

    return router.createUrlTree(['/admin/staging']);
  };
}

export function adminPermissionGuard(permission: string): CanActivateFn {
  return () => {
    const auth = inject(AdminAuthService);
    const router = inject(Router);
    if (!auth.isAuthenticated()) return router.createUrlTree(['/admin/login']);
    return auth.hasPermission(permission) ? true : router.createUrlTree(['/']);
  };
}

/**
 * Redirects already-authenticated users away from the login page.
 */
export const adminGuestGuard: CanActivateFn = () => {
  const auth = inject(AdminAuthService);
  const router = inject(Router);

  if (!auth.isAuthenticated()) {
    return true;
  }

  return router.createUrlTree(['/admin/dashboard']);
};

/** @deprecated Use adminAuthGuard — kept as alias for clarity in docs */
export const AdminAuthGuard = adminAuthGuard;
