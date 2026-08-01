import { ConfigService } from '@nestjs/config';

export function getPublicBackendUrl(config: ConfigService): string {
  const configured = config.get<string>('BACKEND_PUBLIC_URL')?.trim();
  if (configured) {
    return new URL(configured).origin;
  }

  if (config.get<string>('NODE_ENV') === 'production') {
    throw new Error('BACKEND_PUBLIC_URL must be configured in production');
  }

  const port = config.get<string>('PORT') || '3000';
  return `http://localhost:${port}`;
}
