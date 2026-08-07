import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AuthSessionEntity } from './entities/auth-session.entity';
import { PasswordResetTokenEntity } from './entities/password-reset-token.entity';
import { RecoveryMailService } from './recovery-mail.service';

describe('AuthService', () => {
  let service: AuthService;
  let users: {
    findByEmail: jest.Mock;
    findById: jest.Mock;
    createUser: jest.Mock;
    hasAdminUser: jest.Mock;
  };
  let sessions: {
    findOne: jest.Mock;
    update: jest.Mock;
    save: jest.Mock;
    create: jest.Mock;
  };

  beforeEach(async () => {
    users = {
      findByEmail: jest.fn(),
      findById: jest.fn(),
      createUser: jest.fn(),
      hasAdminUser: jest.fn(),
    };
    sessions = {
      findOne: jest.fn(),
      update: jest.fn(),
      create: jest.fn((value) => value),
      save: jest.fn(async (value) => value),
    };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: users },
        {
          provide: JwtService,
          useValue: { sign: jest.fn().mockReturnValue('token') },
        },
        {
          provide: ConfigService,
          useValue: { get: jest.fn().mockReturnValue('test-secret') },
        },
        {
          provide: getRepositoryToken(PasswordResetTokenEntity),
          useValue: {
            update: jest.fn(),
            save: jest.fn(),
            create: jest.fn(),
            findOne: jest.fn(),
          },
        },
        { provide: getRepositoryToken(AuthSessionEntity), useValue: sessions },
        {
          provide: RecoveryMailService,
          useValue: { sendResetLink: jest.fn() },
        },
      ],
    }).compile();
    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => expect(service).toBeDefined());

  it('rejects a session immediately when the user is disabled', async () => {
    users.findById.mockResolvedValue({ id: 'u1', isActive: false });
    sessions.findOne.mockResolvedValue({
      id: 's1',
      userId: 'u1',
      revokedAt: null,
      expiresAt: new Date(Date.now() + 60_000),
    });
    await expect(service.validateSession('u1', 's1')).resolves.toBeNull();
  });

  it('uses live role and permissions rather than JWT claims', async () => {
    users.findById.mockResolvedValue({
      id: 'u1',
      email: 'a@example.com',
      isActive: true,
      role: 'staff',
      permissions: ['catalog.read'],
    });
    sessions.findOne.mockResolvedValue({
      id: 's1',
      userId: 'u1',
      revokedAt: null,
      expiresAt: new Date(Date.now() + 60_000),
    });
    await expect(service.validateSession('u1', 's1')).resolves.toMatchObject({
      role: 'staff',
      permissions: ['catalog.read'],
    });
  });

  it('rejects revoked sessions', async () => {
    users.findById.mockResolvedValue({ id: 'u1', isActive: true });
    sessions.findOne.mockResolvedValue({
      id: 's1',
      userId: 'u1',
      revokedAt: new Date(),
      expiresAt: new Date(Date.now() + 60_000),
    });
    await expect(service.validateSession('u1', 's1')).resolves.toBeNull();
  });
});
