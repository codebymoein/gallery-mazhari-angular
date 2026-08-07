import {
  Body,
  Controller,
  Get,
  Post,
  Request,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { BootstrapAdminDto } from './dto/bootstrap-admin.dto';
import { Throttle } from '@nestjs/throttler';
import type { Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { ForgotPasswordDto, ResetPasswordDto } from './dto/password-reset.dto';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly config: ConfigService,
  ) {}

  @Post('register')
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  async register(
    @Body() dto: RegisterDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.authService.register(dto);
    this.setSessionCookie(response, result.accessToken);
    return { user: result.user };
  }

  @Post('login')
  @Throttle({ default: { limit: 8, ttl: 60_000 } })
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.authService.login(dto);
    if (!result) throw new UnauthorizedException('Invalid credentials');
    this.setSessionCookie(response, result.accessToken);
    return { user: result.user };
  }

  @Post('bootstrap-admin')
  @Throttle({ default: { limit: 3, ttl: 3_600_000 } })
  async bootstrapAdmin(
    @Body() dto: BootstrapAdminDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.authService.bootstrapAdmin(dto);
    this.setSessionCookie(response, result.accessToken);
    return { user: result.user };
  }

  @Post('forgot-password')
  @Throttle({ default: { limit: 3, ttl: 3_600_000 } })
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.requestPasswordReset(dto.email);
  }

  @Post('reset-password')
  @Throttle({ default: { limit: 5, ttl: 3_600_000 } })
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto.token, dto.password);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('logout')
  async logout(
    @Request() req: { user: { sessionId: string } },
    @Res({ passthrough: true }) response: Response,
  ) {
    await this.authService.revokeSession(req.user.sessionId);
    response.clearCookie('mazhari_admin_session', this.cookieOptions());
    return { loggedOut: true };
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('profile')
  profile(
    @Request()
    req: {
      user: {
        userId: string;
        email: string;
        role: string;
        permissions: string[];
      };
    },
  ) {
    return req.user;
  }

  private setSessionCookie(response: Response, token: string): void {
    response.cookie('mazhari_admin_session', token, {
      ...this.cookieOptions(),
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
  }

  private cookieOptions() {
    return {
      httpOnly: true,
      secure: this.config.get<string>('NODE_ENV') === 'production',
      sameSite: 'strict' as const,
      path: '/api',
    };
  }
}
