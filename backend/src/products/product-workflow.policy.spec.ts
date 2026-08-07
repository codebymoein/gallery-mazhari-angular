import { BadRequestException } from '@nestjs/common';
import {
  assertManualProductTransition,
  assertPlatformTransition,
  canPlatformTransition,
} from './product-workflow.policy';

describe('canonical product workflow policy', () => {
  it('allows the intended platform review progression and rejects skips', () => {
    expect(canPlatformTransition('draft', 'pending_data_review')).toBe(true);
    expect(canPlatformTransition('pending_data_review', 'published')).toBe(false);
    expect(() =>
      assertPlatformTransition('pending_data_review', 'published'),
    ).toThrow(BadRequestException);
  });

  it('keeps publish and awaiting-stock behind their dedicated commands', () => {
    const product = { status: 'ready_for_approval' as const, trashedFromStatus: null };
    expect(() => assertManualProductTransition(product, 'published')).toThrow(
      'product_publish_requires_publish_command',
    );
    expect(() =>
      assertManualProductTransition(product, 'awaiting_stock'),
    ).toThrow('awaiting_stock_is_inventory_managed');
  });

  it('restores rejected products only to their recorded previous state', () => {
    const rejected = {
      status: 'rejected' as const,
      trashedFromStatus: 'ready_for_approval' as const,
    };
    expect(() =>
      assertManualProductTransition(rejected, 'ready_for_approval'),
    ).not.toThrow();
    expect(() => assertManualProductTransition(rejected, 'waiting_photo')).toThrow(
      'rejected_product_must_restore_previous_status',
    );
  });
});
