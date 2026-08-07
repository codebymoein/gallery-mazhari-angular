import { BadRequestException } from '@nestjs/common';
import { ProductEntity, ProductStatus } from './entities/product.entity';

const PLATFORM_TRANSITIONS: Partial<Record<ProductStatus, readonly ProductStatus[]>> = {
  draft: ['pending_data_review', 'rejected'],
  pending_data_review: ['pending_variation_review', 'rejected', 'draft'],
  pending_variation_review: [
    'pending_image_review',
    'rejected',
    'pending_data_review',
  ],
  pending_image_review: [
    'enrichment_pending',
    'rejected',
    'pending_variation_review',
  ],
  enrichment_pending: [
    'ready_for_approval',
    'rejected',
    'pending_image_review',
  ],
  media_pending: ['ready_for_approval', 'pending_image_review', 'rejected'],
  approved: ['published', 'rejected', 'ready_for_approval'],
  archived: ['draft'],
};

const MANUAL_LEGACY_TRANSITIONS: Partial<
  Record<ProductStatus, readonly ProductStatus[]>
> = {
  waiting_photo: ['ready_for_approval', 'rejected'],
  ready_for_approval: ['waiting_photo', 'rejected'],
  published: ['rejected'],
  awaiting_stock: ['rejected'],
};

export function canPlatformTransition(
  from: ProductStatus,
  to: ProductStatus,
): boolean {
  if (from === to) return true;
  return PLATFORM_TRANSITIONS[from]?.includes(to) ?? false;
}

export function assertPlatformTransition(
  from: ProductStatus,
  to: ProductStatus,
): void {
  if (!canPlatformTransition(from, to)) {
    throw new BadRequestException(`invalid_product_transition:${from}->${to}`);
  }
}

export function assertManualProductTransition(
  product: Pick<ProductEntity, 'status' | 'trashedFromStatus'>,
  to: ProductStatus,
): void {
  const from = product.status;
  if (from === to) return;

  if (to === 'published') {
    throw new BadRequestException('product_publish_requires_publish_command');
  }
  if (to === 'awaiting_stock') {
    throw new BadRequestException('awaiting_stock_is_inventory_managed');
  }

  if (from === 'rejected') {
    const restoreTarget = product.trashedFromStatus;
    if (!restoreTarget || restoreTarget === 'rejected' || to !== restoreTarget) {
      throw new BadRequestException('rejected_product_must_restore_previous_status');
    }
    return;
  }

  const allowed = MANUAL_LEGACY_TRANSITIONS[from] ?? PLATFORM_TRANSITIONS[from];
  if (!allowed?.includes(to)) {
    throw new BadRequestException(`invalid_product_transition:${from}->${to}`);
  }
}
