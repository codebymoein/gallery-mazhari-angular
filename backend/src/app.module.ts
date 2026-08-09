import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ServeStaticModule } from '@nestjs/serve-static';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { TypeOrmModule } from '@nestjs/typeorm';
import { join } from 'path';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AppearanceModule } from './appearance/appearance.module';
import { AuthModule } from './auth/auth.module';
import { validateEnvironment } from './config/env.validation';
import { ConsultationsModule } from './consultations/consultations.module';
import { CustomRequestsModule } from './custom-requests/custom-requests.module';
import { ALL_ENTITIES } from './database/entities';
import { DiscountsModule } from './discounts/discounts.module';
import { GalleryModule } from './gallery/gallery.module';
import { NotificationsModule } from './notifications/notifications.module';
import { ObservabilityModule } from './observability/observability.module';
import { OrdersModule } from './orders/orders.module';
import { PaymentsModule } from './payments/payments.module';
import { PlannerModule } from './planner/planner.module';
import { PlatformModule } from './platform/platform.module';
import { ProductsModule } from './products/products.module';
import { UsersModule } from './users/users.module';

export { ALL_ENTITIES } from './database/entities';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnvironment,
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60_000,
        limit: 120,
      },
    ]),
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), 'uploads'),
      serveRoot: '/uploads',
    }),
    TypeOrmModule.forRoot(
      process.env.DB_TYPE === 'sqlite'
        ? {
            type: 'better-sqlite3',
            database:
              process.env.DB_SQLITE_PATH ||
              join(process.cwd(), 'data', 'gallery-mazhari.sqlite'),
            entities: ALL_ENTITIES,
            synchronize: false,
          }
        : {
            type: 'postgres',
            host: process.env.DB_HOST,
            port: Number(process.env.DB_PORT ?? 5432),
            username: process.env.DB_USERNAME,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
            entities: ALL_ENTITIES,
            synchronize: false,
            connectTimeoutMS: Number(
              process.env.DB_CONNECT_TIMEOUT_MS ?? 10_000,
            ),
          },
    ),
    AuthModule,
    UsersModule,
    GalleryModule,
    ProductsModule,
    DiscountsModule,
    AppearanceModule,
    PaymentsModule,
    OrdersModule,
    NotificationsModule,
    ConsultationsModule,
    CustomRequestsModule,
    PlannerModule,
    PlatformModule,
    ObservabilityModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
