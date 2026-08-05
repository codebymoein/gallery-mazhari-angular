import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { json, urlencoded } from 'express';
import { AppModule } from './app.module';
import helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const isProduction = process.env.NODE_ENV === 'production';
  if (process.env.TRUST_PROXY === 'true') {
    app.getHttpAdapter().getInstance().set('trust proxy', 1);
  }
  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      hsts: isProduction
        ? { maxAge: 31_536_000, includeSubDomains: true }
        : false,
    }),
  );

  app.setGlobalPrefix('api');
  // عکس‌های صف انتشار به‌صورت data:URL فشرده ارسال می‌شوند؛ سقف پیش‌فرض 100KB کافی نیست.
  app.use(json({ limit: '25mb' }));
  app.use(urlencoded({ extended: true, limit: '25mb' }));
  app.enableCors({
    // چند دامنه با کاما جدا می‌شوند: FRONTEND_ORIGIN=https://test.example.com,http://localhost:4200
    origin: (
      process.env.FRONTEND_ORIGIN ??
      'http://localhost:4200,http://127.0.0.1:4200'
    )
      .split(',')
      .map((o) => o.trim())
      .filter(Boolean),
    credentials: true,
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  const port = process.env.PORT ?? 3000;
  if (isProduction) {
    await app.listen(port, '127.0.0.1');
  } else {
    await app.listen(port);
  }
}
bootstrap();
