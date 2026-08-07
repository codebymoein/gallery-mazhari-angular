import {
  ForbiddenException,
  InternalServerErrorException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { BootstrapAdminDto } from './dto/bootstrap-admin.dto';
import { UserRole } from '../users/entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { createHash, randomBytes, randomUUID } from 'crypto';
import { AuthSessionEntity } from './entities/auth-session.entity';
import { PasswordResetTokenEntity } from './entities/password-reset-token.entity';
import { RecoveryMailService } from './recovery-mail.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    @InjectRepository(PasswordResetTokenEntity)
    private readonly resetTokens: Repository<PasswordResetTokenEntity>,
    @InjectRepository(AuthSessionEntity)
    private readonly sessions: Repository<AuthSessionEntity>,
    private readonly recoveryMail: RecoveryMailService,
  ) {}

  async requestPasswordReset(email: string) {
    const normalized = email.trim().toLowerCase();
    const user = await this.usersService.findByEmail(normalized);
    if (
      !user ||
      !user.isActive ||
      (user.role !== UserRole.ADMIN && user.role !== UserRole.STAFF)
    ) {
      return { accepted: true };
    }
    await this.resetTokens.update(
      { userId: user.id, usedAt: IsNull() },
      { usedAt: new Date().toISOString() },
    );
    const rawToken = randomBytes(32).toString('base64url');
    const expiresMinutes = 20;
    const resetRecord = await this.resetTokens.save(
      this.resetTokens.create({
        userId: user.id,
        tokenHash: this.hashResetToken(rawToken),
        expiresAt: new Date(Date.now() + expiresMinutes * 60_000).toISOString(),
        usedAt: null,
      }),
    );
    const frontend = (
      this.configService.get<string>('FRONTEND_ORIGIN') ||
      'http://localhost:4200'
    )
      .split(',')[0]
      .trim();
    try {
      await this.recoveryMail.sendResetLink(
        user.email,
        `${frontend}/admin/reset-password?token=${encodeURIComponent(rawToken)}`,
        expiresMinutes,
      );
    } catch (error) {
      await this.resetTokens.remove(resetRecord);
      throw error;
    }
    return { accepted: true };
  }

  async resetPassword(token: string, password: string) {
    const record = await this.resetTokens.findOne({
      where: { tokenHash: this.hashResetToken(token), usedAt: IsNull() },
    });
    if (!record || Date.parse(record.expiresAt) <= Date.now()) {
      throw new ForbiddenException('password_reset_token_invalid_or_expired');
    }
    const passwordHash = await bcrypt.hash(password, 12);
    await this.usersService.updateUser(record.userId, { passwordHash });
    record.usedAt = new Date().toISOString();
    await this.resetTokens.save(record);
    await this.revokeAllUserSessions(record.userId);
    return { reset: true };
  }

  private hashResetToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  async register(dto: RegisterDto) {
    const existingUser = await this.usersService.findByEmail(dto.email);
    if (existingUser)
      throw new ConflictException('Email is already registered');
    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = await this.usersService.createUser({
      fullName: dto.fullName,
      email: dto.email,
      passwordHash,
    });
    return this.issueSession(
      user.id,
      user.email,
      user.role,
      user.fullName,
      user.permissions,
    );
  }

  async login(dto: LoginDto) {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user || !user.isActive) return null;
    if (!(await bcrypt.compare(dto.password, user.passwordHash))) return null;
    return this.issueSession(
      user.id,
      user.email,
      user.role,
      user.fullName,
      user.permissions,
    );
  }

  async bootstrapAdmin(dto: BootstrapAdminDto) {
    const configuredSetupKey =
      this.configService.get<string>('ADMIN_SETUP_KEY');
    if (!configuredSetupKey)
      throw new InternalServerErrorException(
        'ADMIN_SETUP_KEY is not configured',
      );
    if (dto.setupKey !== configuredSetupKey)
      throw new ForbiddenException('Invalid setup key');
    if (await this.usersService.hasAdminUser())
      throw new ConflictException('Admin user already exists');

    const existingUser = await this.usersService.findByEmail(dto.email);
    if (existingUser) {
      const promoted = await this.usersService.setRole(
        existingUser.id,
        UserRole.ADMIN,
      );
      if (!promoted)
        throw new InternalServerErrorException(
          'Failed to promote existing user',
        );
      return this.issueSession(
        promoted.id,
        promoted.email,
        promoted.role,
        promoted.fullName,
        promoted.permissions,
      );
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const admin = await this.usersService.createUser({
      fullName: dto.fullName,
      email: dto.email,
      passwordHash,
      role: UserRole.ADMIN,
    });
    return this.issueSession(
      admin.id,
      admin.email,
      admin.role,
      admin.fullName,
      admin.permissions,
    );
  }

  async validateSession(userId: string, sessionId: string) {
    const [user, session] = await Promise.all([
      this.usersService.findById(userId),
      this.sessions.findOne({ where: { id: sessionId, userId } }),
    ]);
    if (
      !user ||
      !user.isActive ||
      !session ||
      session.revokedAt ||
      session.expiresAt.getTime() <= Date.now()
    )
      return null;
    return {
      userId: user.id,
      email: user.email,
      role: user.role,
      permissions: user.permissions ?? [],
      sessionId,
    };
  }

  async revokeSession(sessionId: string): Promise<void> {
    await this.sessions.update(
      { id: sessionId, revokedAt: IsNull() },
      { revokedAt: new Date() },
    );
  }

  async revokeAllUserSessions(userId: string): Promise<void> {
    await this.sessions.update(
      { userId, revokedAt: IsNull() },
      { revokedAt: new Date() },
    );
  }

  private async issueSession(
    userId: string,
    email: string,
    role: string,
    fullName?: string,
    permissions: string[] = [],
  ) {
    const sessionId = randomUUID();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await this.sessions.save(
      this.sessions.create({
        id: sessionId,
        userId,
        expiresAt,
      }),
    );
    return {
      accessToken: this.jwtService.sign({ sub: userId, sid: sessionId }),
      user: { id: userId, email, role, fullName, permissions },
    };
  }
}
