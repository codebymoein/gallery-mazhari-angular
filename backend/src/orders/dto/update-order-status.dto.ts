import { IsIn } from 'class-validator';
import type { OrderStatus } from '../entities/order.entity';

export class UpdateOrderStatusDto {
  @IsIn([
    'processing',
    'preparing',
    'ready',
    'shipped',
    'completed',
    'cancelled',
  ])
  status: OrderStatus;
}
