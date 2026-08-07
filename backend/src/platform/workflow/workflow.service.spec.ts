import { BadRequestException } from '@nestjs/common';
import { ProductEntity } from '../../products/entities/product.entity';
import { WorkflowService } from './workflow.service';

const product = (value: Partial<ProductEntity>): ProductEntity =>
  ({
    id: value.id || 'id',
    code: value.code || 'X',
    name: 'name',
    category: 'cat',
    parentCategory: 'parent',
    parentCategorySlug: 'parent',
    categorySlug: 'cat',
    stock: 1,
    isNewImport: false,
    status: 'ready_for_approval',
    photos: [{ url: 'x', fileName: 'x', addedAt: 'x' }],
    productType: 'simple',
    reservedStock: 0,
    lowStockThreshold: 2,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...value,
  }) as ProductEntity;

describe('WorkflowService transition enforcement', () => {
  it('rejects an invalid batch before the first product write', async () => {
    const rows = [
      product({ id: 'ok', status: 'ready_for_approval' }),
      product({ id: 'bad', status: 'awaiting_stock' }),
    ];
    const products = {
      find: jest.fn(async () => rows),
      save: jest.fn(async (row: ProductEntity) => row),
    };
    const service = new WorkflowService(
      products as never,
      {} as never,
      { record: jest.fn() } as never,
    );

    await expect(
      service.approveMany({ productIds: ['ok', 'bad'], actor: 'admin' }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(products.save).not.toHaveBeenCalled();
  });

  it('advances a valid approval through the canonical policy', async () => {
    const row = product({ id: 'ok', status: 'ready_for_approval' });
    const products = {
      find: jest.fn(async () => [row]),
      save: jest.fn(async (value: ProductEntity) => value),
    };
    const audit = { record: jest.fn(async () => undefined) };
    const service = new WorkflowService(
      products as never,
      {} as never,
      audit as never,
    );

    await expect(
      service.approveMany({ productIds: ['ok'], actor: 'admin' }),
    ).resolves.toEqual({ approved: 1, published: 0 });
    expect(row.status).toBe('approved');
    expect(audit.record).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'product.approved',
        previousValue: { status: 'ready_for_approval' },
        newValue: { status: 'approved' },
      }),
    );
  });
});
