import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '../../users/entities/user.entity';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}
  canActivate(context: ExecutionContext): boolean {
    const required =
      this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
        context.getHandler(),
        context.getClass(),
      ]) || [];
    if (!required.length) return true;
    const user = context
      .switchToHttp()
      .getRequest<{ user?: { role: UserRole; permissions?: string[] } }>().user;
    if (!user) throw new ForbiddenException('Authentication required');
    if (user.role === UserRole.ADMIN) return true;
    if (
      required.every((permission) =>
        (user.permissions || []).includes(permission),
      )
    )
      return true;
    throw new ForbiddenException('Insufficient permissions');
  }
}
