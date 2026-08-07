import { plainToInstance } from 'class-transformer';
import {
  IsEmail,
  IsEnum,
  IsNumberString,
  IsOptional,
  IsString,
  IsUrl,
  validateSync,
} from 'class-validator';

const PRODUCTION_PLACEHOLDERS = new Set([
  'change_me',
  'changeme',
  'change_me_super_secret',
  'change_this_admin_setup_key',
  'change_this',
  'default',
  'example',
  'password',
  'secret',
  'test',
]);

const PRODUCTION_SECRET_FIELDS = [
  'JWT_SECRET',
  'ADMIN_SETUP_KEY',
  'DB_PASSWORD',
  'SMTP_PASSWORD',
] as const;

const REQUIRED_PRODUCTION_DB_FIELDS = [
  'DB_HOST',
  'DB_USERNAME',
  'DB_PASSWORD',
  'DB_NAME',
] as const;

export class EnvironmentVariables {
  @IsOptional()
  @IsNumberString()
  PORT: string;

  @IsOptional()
  @IsEnum(['postgres', 'sqlite'])
  DB_TYPE: 'postgres' | 'sqlite';

  @IsOptional()
  @IsString()
  DB_HOST: string;

  @IsOptional()
  @IsNumberString()
  DB_PORT: string;

  @IsOptional()
  @IsNumberString()
  DB_CONNECT_TIMEOUT_MS: string;

  @IsOptional()
  @IsString()
  DB_USERNAME: string;

  @IsOptional()
  @IsString()
  DB_PASSWORD: string;

  @IsOptional()
  @IsString()
  DB_NAME: string;

  @IsString()
  JWT_SECRET: string;

  @IsOptional()
  @IsString()
  JWT_EXPIRES_IN: string;

  @IsOptional()
  @IsString()
  ADMIN_SETUP_KEY: string;

  @IsOptional() @IsEmail() ADMIN_RECOVERY_EMAIL: string;
  @IsOptional() @IsString() SMTP_HOST: string;
  @IsOptional() @IsNumberString() SMTP_PORT: string;
  @IsOptional() @IsString() SMTP_USER: string;
  @IsOptional() @IsString() SMTP_PASSWORD: string;
  @IsOptional() @IsString() SMTP_FROM: string;

  @IsOptional()
  @IsUrl({ require_tld: false })
  BACKEND_PUBLIC_URL: string;

  @IsOptional()
  @IsEnum(['true', 'false'])
  TRUST_PROXY: 'true' | 'false';

  @IsOptional()
  @IsEnum(['development', 'production', 'test'])
  NODE_ENV: 'development' | 'production' | 'test';
}

function normalizeSecret(value: unknown): string {
  return typeof value === 'string' ? value.trim().toLowerCase() : '';
}

function assertProductionDatabase(config: EnvironmentVariables): void {
  if (config.NODE_ENV !== 'production') {
    return;
  }

  if (config.DB_TYPE === 'sqlite') {
    throw new Error('Production configuration requires PostgreSQL; sqlite is not allowed.');
  }

  for (const field of REQUIRED_PRODUCTION_DB_FIELDS) {
    if (!config[field] || String(config[field]).trim().length === 0) {
      throw new Error(`Production configuration requires ${field}.`);
    }
  }
}

function assertProductionSecrets(config: EnvironmentVariables): void {
  if (config.NODE_ENV !== 'production') {
    return;
  }

  if (!config.JWT_SECRET || config.JWT_SECRET.trim().length < 32) {
    throw new Error(
      'Production configuration requires JWT_SECRET with at least 32 characters.',
    );
  }

  for (const field of PRODUCTION_SECRET_FIELDS) {
    const rawValue = config[field];
    if (!rawValue) {
      continue;
    }

    const normalized = normalizeSecret(rawValue);
    if (
      PRODUCTION_PLACEHOLDERS.has(normalized) ||
      normalized.startsWith('change_me') ||
      normalized.startsWith('change_this')
    ) {
      throw new Error(
        `Production configuration rejects placeholder value for ${field}.`,
      );
    }
  }
}

export function validateEnvironment(
  config: Record<string, unknown>,
): EnvironmentVariables {
  const validatedConfig = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });

  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    throw new Error(errors.toString());
  }

  assertProductionDatabase(validatedConfig);
  assertProductionSecrets(validatedConfig);
  return validatedConfig;
}

export default EnvironmentVariables;
