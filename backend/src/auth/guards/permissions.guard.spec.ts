import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PermissionsGuard } from './permissions.guard';
import { UserRole } from '../../users/entities/user.entity';

describe('PermissionsGuard', () => {
  const contextFor = (user?: {
    role: UserRole;
    permissions?: string[];
  }): ExecutionContext =>
    ({
      getHandler: () => function handler() {},
      getClass: () => class TestController {},
      switchToHttp: () => ({ getRequest: () => ({ user }) }),
    }) as unknown as ExecutionContext;

  it('allows an administrator regardless of granular permission list', () => {
    const reflector = {
      getAllAndOverride: jest.fn().mockReturnValue(['inventory.import.manage']),
    } as unknown as Reflector;
    const guard = new PermissionsGuard(reflector);

    expect(guard.canActivate(contextFor({ role: UserRole.ADMIN }))).toBe(true);
  });

  it('allows staff only when every required permission is live on the principal', () => {
    const reflector = {
      getAllAndOverride: jest
        .fn()
        .mockReturnValue(['inventory.import.manage', 'audit.read']),
    } as unknown as Reflector;
    const guard = new PermissionsGuard(reflector);

    expect(
      guard.canActivate(
        contextFor({
          role: UserRole.STAFF,
          permissions: ['inventory.import.manage', 'audit.read'],
        }),
      ),
    ).toBe(true);
  });

  it('rejects staff missing a required permission', () => {
    const reflector = {
      getAllAndOverride: jest.fn().mockReturnValue(['publishing.queue.manage']),
    } as unknown as Reflector;
    const guard = new PermissionsGuard(reflector);

    expect(() =>
      guard.canActivate(
        contextFor({ role: UserRole.STAFF, permissions: ['catalog.manage'] }),
      ),
    ).toThrow(ForbiddenException);
  });
});
