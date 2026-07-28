import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { json, urlencoded } from 'express';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api');
  // عکس‌های صف انتشار به‌صورت data:URL فشرده ارسال می‌شوند؛ سقف پیش‌فرض 100KB کافی نیست.
  app.use(json({ limit: '25mb' }));
  app.use(urlencoded({ extended: true, limit: '25mb' }));
  app.enableCors({
    // چند دامنه با کاما جدا می‌شوند: FRONTEND_ORIGIN=https://test.example.com,http://localhost:4200
    origin: (process.env.FRONTEND_ORIGIN ?? 'http://localhost:4200')
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

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
