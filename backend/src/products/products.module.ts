import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductEntity } from './entities/product.entity';
import { ProductVariationEntity } from '../platform/import/entities/product-variation.entity';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';
import { DiscountsModule } from '../discounts/discounts.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ProductEntity, ProductVariationEntity]),
    DiscountsModule,
  ],
  providers: [ProductsService],
  controllers: [ProductsController],
})
export class ProductsModule {}
