import 'reflect-metadata';
import { validateEnvironment } from './env.validation';

describe('validateEnvironment', () => {
  const productionBase = {
    NODE_ENV: 'production',
    DB_TYPE: 'postgres',
    DB_HOST: '127.0.0.1',
    DB_USERNAME: 'gallery',
    DB_PASSWORD: 'production-db-password-value',
    DB_NAME: 'gallery',
    JWT_SECRET: `test-only-${'x'.repeat(40)}`,
    MEDIA_STORAGE_DRIVER: 's3',
    MEDIA_S3_ENDPOINT: 'https://objects.example.test',
    MEDIA_S3_REGION: 'auto',
    MEDIA_S3_BUCKET: 'gallery-media',
    MEDIA_S3_ACCESS_KEY_ID: 'test-access-key-id',
    MEDIA_S3_SECRET_ACCESS_KEY: 'test-secret-access-key-value',
    MEDIA_PUBLIC_BASE_URL: 'https://media.example.test',
  };

  it('accepts a complete non-placeholder PostgreSQL production configuration', () => {
    expect(() => validateEnvironment(productionBase)).not.toThrow();
  });

  it('rejects sqlite in production', () => {
    expect(() =>
      validateEnvironment({ ...productionBase, DB_TYPE: 'sqlite' }),
    ).toThrow(/PostgreSQL/);
  });

  it('rejects missing production database variables', () => {
    expect(() =>
      validateEnvironment({ ...productionBase, DB_HOST: '' }),
    ).toThrow(/DB_HOST/);
  });

  it('rejects local media storage in production', () => {
    expect(() =>
      validateEnvironment({ ...productionBase, MEDIA_STORAGE_DRIVER: 'local' }),
    ).toThrow(/MEDIA_STORAGE_DRIVER=s3/);
  });

  it('rejects incomplete object storage configuration in production', () => {
    expect(() =>
      validateEnvironment({ ...productionBase, MEDIA_S3_BUCKET: '' }),
    ).toThrow(/MEDIA_S3_BUCKET/);
  });

  it('rejects placeholder object storage secrets in production', () => {
    expect(() =>
      validateEnvironment({
        ...productionBase,
        MEDIA_S3_SECRET_ACCESS_KEY: 'change_me',
      }),
    ).toThrow(/MEDIA_S3_SECRET_ACCESS_KEY/);
  });

  it('rejects the documented JWT placeholder in production', () => {
    expect(() =>
      validateEnvironment({
        ...productionBase,
        JWT_SECRET: 'change_me_super_secret',
      }),
    ).toThrow(/JWT_SECRET/);
  });

  it('rejects short JWT secrets in production', () => {
    expect(() =>
      validateEnvironment({
        ...productionBase,
        JWT_SECRET: 'too-short',
      }),
    ).toThrow(/at least 32 characters/);
  });

  it('rejects placeholder admin setup keys in production when configured', () => {
    expect(() =>
      validateEnvironment({
        ...productionBase,
        ADMIN_SETUP_KEY: 'change_this_admin_setup_key',
      }),
    ).toThrow(/ADMIN_SETUP_KEY/);
  });

  it('allows development placeholders and local media storage', () => {
    expect(() =>
      validateEnvironment({
        NODE_ENV: 'development',
        DB_TYPE: 'sqlite',
        JWT_SECRET: 'change_me_super_secret',
        MEDIA_STORAGE_DRIVER: 'local',
      }),
    ).not.toThrow();
  });
});
