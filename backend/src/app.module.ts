import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ServeStaticModule } from '@nestjs/serve-static';
import { TypeOrmModule } from '@nestjs/typeorm';
import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { join } from 'path';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import EnvironmentVariables from './config/env.validation';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { GalleryModule } from './gallery/gallery.module';
import { ProductsModule } from './products/products.module';
import { UserEntity } from './users/entities/user.entity';
import { GalleryItemEntity } from './gallery/entities/gallery-item.entity';
import { ProductEntity } from './products/entities/product.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: (config) => {
        const validatedConfig = plainToInstance(EnvironmentVariables, config, {
          enableImplicitConversion: true,
        });

        const errors = validateSync(validatedConfig, {
          skipMissingProperties: false,
        });

        if (errors.length > 0) {
          throw new Error(errors.toString());
        }

        return validatedConfig;
      },
    }),
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), 'uploads'),
      serveRoot: '/uploads',
    }),
    TypeOrmModule.forRoot(
      // DB_TYPE=sqlite → توسعه محلی بدون نیاز به نصب Postgres؛
      // در سرور، DB_TYPE=postgres (یا خالی) با متغیرهای DB_* کار می‌کند.
      process.env.DB_TYPE === 'sqlite'
        ? {
            type: 'better-sqlite3',
            database:
              process.env.DB_SQLITE_PATH ||
              join(process.cwd(), 'data', 'gallery-mazhari.sqlite'),
            entities: [UserEntity, GalleryItemEntity, ProductEntity],
            synchronize: true,
          }
        : {
            type: 'postgres',
            host: process.env.DB_HOST,
            port: Number(process.env.DB_PORT ?? 5432),
            username: process.env.DB_USERNAME,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
            entities: [UserEntity, GalleryItemEntity, ProductEntity],
            synchronize: true,
          },
    ),
    AuthModule,
    UsersModule,
    GalleryModule,
    ProductsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
