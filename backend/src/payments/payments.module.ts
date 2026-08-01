import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductEntity } from '../products/entities/product.entity';
import { PaymentSettingsEntity } from './entities/payment-settings.entity';
import { PaymentTransactionEntity } from './entities/payment-transaction.entity';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { DiscountsModule } from '../discounts/discounts.module';
import { OrdersModule } from '../orders/orders.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PaymentSettingsEntity,
      PaymentTransactionEntity,
      ProductEntity,
    ]),
    DiscountsModule,
    OrdersModule,
  ],
  controllers: [PaymentsController],
  providers: [PaymentsService],
})
export class PaymentsModule {}
