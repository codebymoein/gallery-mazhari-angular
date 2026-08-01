import { ConfigService } from '@nestjs/config';
import { getPublicBackendUrl } from './public-url';

describe('getPublicBackendUrl', () => {
  it('normalizes a configured public URL to its origin', () => {
    const config = new ConfigService({
      BACKEND_PUBLIC_URL: 'https://api.example.com/base/path',
      NODE_ENV: 'production',
    });

    expect(getPublicBackendUrl(config)).toBe('https://api.example.com');
  });

  it('rejects a missing public URL in production', () => {
    const config = new ConfigService({ NODE_ENV: 'production' });

    expect(() => getPublicBackendUrl(config)).toThrow(
      'BACKEND_PUBLIC_URL must be configured in production',
    );
  });

  it('uses localhost only outside production', () => {
    const config = new ConfigService({ NODE_ENV: 'development', PORT: '3100' });

    expect(getPublicBackendUrl(config)).toBe('http://localhost:3100');
  });
});
