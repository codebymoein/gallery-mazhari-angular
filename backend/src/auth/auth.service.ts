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

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

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

    return this.issueToken(user.id, user.email, user.role);
  }

  async login(dto: LoginDto) {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) {
      return null;
    }

    const isValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isValid) {
      return null;
    }

    return this.issueToken(user.id, user.email, user.role);
  }

  async bootstrapAdmin(dto: BootstrapAdminDto) {
    const configuredSetupKey = this.configService.get<string>('ADMIN_SETUP_KEY');
    if (!configuredSetupKey) {
      throw new InternalServerErrorException('ADMIN_SETUP_KEY is not configured');
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
      const promoted = await this.usersService.setRole(existingUser.id, UserRole.ADMIN);
      if (!promoted) {
        throw new InternalServerErrorException('Failed to promote existing user');
      }
      return this.issueToken(promoted.id, promoted.email, promoted.role);
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const admin = await this.usersService.createUser({
      fullName: dto.fullName,
      email: dto.email,
      passwordHash,
      role: UserRole.ADMIN,
    });

    return this.issueToken(admin.id, admin.email, admin.role);
  }

  private issueToken(userId: string, email: string, role: string) {
    return {
      accessToken: this.jwtService.sign({
        sub: userId,
        email,
        role,
      }),
      user: {
        id: userId,
        email,
        role,
      },
    };
  }
}
