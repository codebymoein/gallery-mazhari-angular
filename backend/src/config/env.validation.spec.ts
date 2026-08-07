import { validateEnvironment } from './env.validation';

describe('validateEnvironment', () => {
  const productionBase = {
    NODE_ENV: 'production',
    DB_TYPE: 'postgres',
    JWT_SECRET: `test-only-${'x'.repeat(40)}`,
  };

  it('accepts a non-placeholder production JWT secret', () => {
    expect(() => validateEnvironment(productionBase)).not.toThrow();
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

  it('allows development placeholders so local setup remains explicit and non-production', () => {
    expect(() =>
      validateEnvironment({
        NODE_ENV: 'development',
        DB_TYPE: 'sqlite',
        JWT_SECRET: 'change_me_super_secret',
      }),
    ).not.toThrow();
  });
});
