import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ServeStaticModule } from '@nestjs/serve-static';
import { TypeOrmModule } from '@nestjs/typeorm';
import { join } from 'path';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { validateEnvironment } from './config/env.validation';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { GalleryModule } from './gallery/gallery.module';
import { ProductsModule } from './products/products.module';
import { PlatformModule, PLATFORM_ENTITIES } from './platform/platform.module';
import { UserEntity } from './users/entities/user.entity';
import { GalleryItemEntity } from './gallery/entities/gallery-item.entity';
import { ProductEntity } from './products/entities/product.entity';
import { DiscountsModule } from './discounts/discounts.module';
import { DiscountRuleEntity } from './discounts/entities/discount-rule.entity';
import { AppearanceModule } from './appearance/appearance.module';
import { SiteAppearanceEntity } from './appearance/entities/site-appearance.entity';
import { PaymentsModule } from './payments/payments.module';
import { PaymentSettingsEntity } from './payments/entities/payment-settings.entity';
import { PaymentTransactionEntity } from './payments/entities/payment-transaction.entity';
import { OrdersModule } from './orders/orders.module';
import { OrderEntity } from './orders/entities/order.entity';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { NotificationsModule } from './notifications/notifications.module';
import { NotificationSettingsEntity } from './notifications/entities/notification-settings.entity';
import { NotificationDeliveryEntity } from './notifications/entities/notification-delivery.entity';
import { ConsultationsModule } from './consultations/consultations.module';
import { ConsultationEntity } from './consultations/entities/consultation.entity';
import { PasswordResetTokenEntity } from './auth/entities/password-reset-token.entity';
import { CustomRequestsModule } from './custom-requests/custom-requests.module';
import { CustomRequestEntity } from './custom-requests/entities/custom-request.entity';

export const ALL_ENTITIES = [
  UserEntity,
  GalleryItemEntity,
  ProductEntity,
  DiscountRuleEntity,
  SiteAppearanceEntity,
  PaymentSettingsEntity,
  PaymentTransactionEntity,
  OrderEntity,
  NotificationSettingsEntity,
  NotificationDeliveryEntity,
  ConsultationEntity,
  PasswordResetTokenEntity,
  CustomRequestEntity,
  ...PLATFORM_ENTITIES,
];

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
      // DB_TYPE=sqlite → local development without installing Postgres;
      // on server, DB_TYPE=postgres (or empty) uses DB_* variables.
      process.env.DB_TYPE === 'sqlite'
        ? {
            type: 'better-sqlite3',
            database:
              process.env.DB_SQLITE_PATH ||
              join(process.cwd(), 'data', 'gallery-mazhari.sqlite'),
            entities: ALL_ENTITIES,
            synchronize: process.env.NODE_ENV !== 'production',
          }
        : {
            type: 'postgres',
            host: process.env.DB_HOST,
            port: Number(process.env.DB_PORT ?? 5432),
            username: process.env.DB_USERNAME,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
            entities: ALL_ENTITIES,
            synchronize: process.env.NODE_ENV !== 'production',
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
    PlatformModule,
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
