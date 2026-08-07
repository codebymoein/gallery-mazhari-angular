import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ConfigService, private readonly authService: AuthService) {
    super({
      jwtFromRequest: (request: { headers?: { cookie?: string } }) => {
        const cookie = request?.headers?.cookie || '';
        const match = cookie.match(/(?:^|;\s*)mazhari_admin_session=([^;]+)/);
        return match ? decodeURIComponent(match[1]) : null;
      },
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<string>('JWT_SECRET'),
    });
  }

  async validate(payload: { sub: string; sid?: string }) {
    if (!payload.sid) throw new UnauthorizedException('session_required');
    const principal = await this.authService.validateSession(payload.sub, payload.sid);
    if (!principal) throw new UnauthorizedException('session_revoked_or_invalid');
    return principal;
  }
}
