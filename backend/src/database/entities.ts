import { SiteAppearanceEntity } from '../appearance/entities/site-appearance.entity';
import { AuthSessionEntity } from '../auth/entities/auth-session.entity';
import { PasswordResetTokenEntity } from '../auth/entities/password-reset-token.entity';
import { ConsultationEntity } from '../consultations/entities/consultation.entity';
import { CustomRequestEntity } from '../custom-requests/entities/custom-request.entity';
import { DiscountRuleEntity } from '../discounts/entities/discount-rule.entity';
import { GalleryItemEntity } from '../gallery/entities/gallery-item.entity';
import { NotificationDeliveryEntity } from '../notifications/entities/notification-delivery.entity';
import { NotificationSettingsEntity } from '../notifications/entities/notification-settings.entity';
import { OrderEntity } from '../orders/entities/order.entity';
import { PaymentSettingsEntity } from '../payments/entities/payment-settings.entity';
import { PaymentTransactionEntity } from '../payments/entities/payment-transaction.entity';
import { PLATFORM_ENTITIES } from '../platform/platform.entities';
import { ProductEntity } from '../products/entities/product.entity';
import { UserEntity } from '../users/entities/user.entity';

/** Canonical TypeORM entity registry shared by runtime and migration tooling. */
export const ALL_ENTITIES = [
  UserEntity,
  AuthSessionEntity,
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
