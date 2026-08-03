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
import { createHash, randomBytes } from 'crypto';
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
      // A failed delivery must not leave an unusable active reset token in DB.
      await this.resetTokens.remove(resetRecord);
      throw error;
    }
    return { accepted: true };
  }

  async resetPassword(token: string, password: string) {
    const record = await this.resetTokens.findOne({
      where: { tokenHash: this.hashResetToken(token), usedAt: IsNull() },
    });
    if (!record || Date.parse(record.expiresAt) <= Date.now())
      throw new ForbiddenException('password_reset_token_invalid_or_expired');
    const passwordHash = await bcrypt.hash(password, 12);
    await this.usersService.updateUser(record.userId, { passwordHash });
    record.usedAt = new Date().toISOString();
    await this.resetTokens.save(record);
    return { reset: true };
  }

  private hashResetToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  async register(dto: RegisterDto) {
    const existingUser = await this.usersService.findByEmail(dto.email);
    if (existingUser) {
      throw new ConflictException('Email is already registered');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = await this.usersService.createUser({
      fullName: dto.fullName,
      email: dto.email,
      passwordHash,
    });

    return this.issueToken(
      user.id,
      user.email,
      user.role,
      user.fullName,
      user.permissions,
    );
  }

  async login(dto: LoginDto) {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) {
      return null;
    }

    if (!user.isActive) return null;

    const isValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isValid) {
      return null;
    }

    return this.issueToken(
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
    if (!configuredSetupKey) {
      throw new InternalServerErrorException(
        'ADMIN_SETUP_KEY is not configured',
      );
    }

    if (dto.setupKey !== configuredSetupKey) {
      throw new ForbiddenException('Invalid setup key');
    }

    const hasAdmin = await this.usersService.hasAdminUser();
    if (hasAdmin) {
      throw new ConflictException('Admin user already exists');
    }

    const existingUser = await this.usersService.findByEmail(dto.email);
    if (existingUser) {
      const promoted = await this.usersService.setRole(
        existingUser.id,
        UserRole.ADMIN,
      );
      if (!promoted) {
        throw new InternalServerErrorException(
          'Failed to promote existing user',
        );
      }
      return this.issueToken(
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

    return this.issueToken(
      admin.id,
      admin.email,
      admin.role,
      admin.fullName,
      admin.permissions,
    );
  }

  private issueToken(
    userId: string,
    email: string,
    role: string,
    fullName?: string,
    permissions: string[] = [],
  ) {
    return {
      accessToken: this.jwtService.sign({
        sub: userId,
        email,
        role,
        permissions,
      }),
      user: {
        id: userId,
        email,
        role,
        fullName,
        permissions,
      },
    };
  }
}
