import { BadRequestException } from '@nestjs/common';
import { ProductEntity, ProductStatus } from './entities/product.entity';

export const PRODUCT_STATUSES: readonly ProductStatus[] = [
  'waiting_photo',
  'ready_for_approval',
  'published',
  'awaiting_stock',
  'rejected',
  'draft',
  'pending_data_review',
  'pending_variation_review',
  'pending_image_review',
  'enrichment_pending',
  'media_pending',
  'ready_for_approval_platform',
  'approved',
  'archived',
] as const;

const PRODUCT_STATUS_SET = new Set<string>(PRODUCT_STATUSES);

const PLATFORM_TRANSITIONS: Partial<
  Record<ProductStatus, readonly ProductStatus[]>
> = {
  waiting_photo: ['ready_for_approval', 'rejected'],
  ready_for_approval: [
    'approved',
    'rejected',
    'enrichment_pending',
    'waiting_photo',
  ],
  published: ['archived', 'rejected'],
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
  ready_for_approval_platform: ['approved', 'rejected', 'enrichment_pending'],
  approved: [
    'published',
    'rejected',
    'ready_for_approval',
    'pending_image_review',
  ],
  rejected: ['draft'],
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

export function isProductStatus(value: unknown): value is ProductStatus {
  return typeof value === 'string' && PRODUCT_STATUS_SET.has(value);
}

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

  if (from === 'rejected') {
    const restoreTarget = product.trashedFromStatus;
    if (!restoreTarget || restoreTarget === 'rejected' || to !== restoreTarget) {
      throw new BadRequestException('rejected_product_must_restore_previous_status');
    }
    return;
  }

  if (to === 'published') {
    throw new BadRequestException('product_publish_requires_publish_command');
  }
  if (to === 'awaiting_stock') {
    throw new BadRequestException('awaiting_stock_is_inventory_managed');
  }

  const allowed = MANUAL_LEGACY_TRANSITIONS[from] ?? PLATFORM_TRANSITIONS[from];
  if (!allowed?.includes(to)) {
    throw new BadRequestException(`invalid_product_transition:${from}->${to}`);
  }
}
