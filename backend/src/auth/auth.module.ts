import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from '../users/users.module';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './strategies/jwt.strategy';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthSessionEntity } from './entities/auth-session.entity';
import { PasswordResetTokenEntity } from './entities/password-reset-token.entity';
import { RecoveryMailService } from './recovery-mail.service';

@Module({
  imports: [
    UsersModule,
    TypeOrmModule.forFeature([PasswordResetTokenEntity, AuthSessionEntity]),
    PassportModule,
    ConfigModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.getOrThrow<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: (configService.get<string>('JWT_EXPIRES_IN') ??
            '7d') as any,
        },
      }),
    }),
  ],
  providers: [AuthService, JwtStrategy, RecoveryMailService],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}
