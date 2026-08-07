import { ConflictException } from '@nestjs/common';
import { CatalogContractService } from './catalog-contract.service';
import { ProductEntity } from './entities/product.entity';

const VERSION = '2026-08-07T12:00:00.000Z';

const product = (value: Partial<ProductEntity> = {}): ProductEntity =>
  Object.assign(new ProductEntity(), {
    id: 'id',
    code: 'CODE',
    name: 'name',
    category: 'old',
    parentCategory: 'old',
    parentCategorySlug: 'old',
    categorySlug: 'old',
    stock: 1,
    isNewImport: true,
    status: 'waiting_photo',
    photos: [],
    productType: 'simple',
    reservedStock: 0,
    lowStockThreshold: 2,
    createdAt: new Date('2026-08-07T00:00:00.000Z'),
    updatedAt: new Date(VERSION),
    ...value,
  });

const catalogDto = (expectedUpdatedAt = VERSION) => ({
  category: 'کفش عروس',
  categorySlug: 'bridal-shoes',
  parentCategory: 'کفش، کتونی و کیف',
  parentCategorySlug: 'bridal-shoes-bags',
  expectedUpdatedAt,
});

describe('CatalogContractService', () => {
  const manager = {
    findOne: jest.fn(),
    save: jest.fn((_entity: unknown, row: ProductEntity) => Promise.resolve(row)),
  };
  const repo = {
    manager: {
      transaction: jest.fn((callback: (tx: typeof manager) => unknown) =>
        Promise.resolve(callback(manager)),
      ),
    },
  };
  const products = { getPublished: jest.fn() };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns a stable revision and bounded TTL for an unchanged published snapshot', async () => {
    products.getPublished.mockResolvedValue([product({ status: 'published' })]);
    const service = new CatalogContractService(
      repo as never,
      products as never,
    );

    const first = await service.getPublishedSnapshot();
    const second = await service.getPublishedSnapshot();

    expect(first.revision).toBe(second.revision);
    expect(first.revision).toMatch(/^[a-f0-9]{24}$/);
    expect(first.ttlSeconds).toBe(60);
    expect(second.products).toHaveLength(1);
  });

  it('rejects a stale catalog write before any save occurs', async () => {
    manager.findOne.mockResolvedValue(product());
    const service = new CatalogContractService(
      repo as never,
      products as never,
    );

    await expect(
      service.updateCatalog('id', catalogDto('2026-08-07T11:59:59.000Z')),
    ).rejects.toBeInstanceOf(ConflictException);

    expect(manager.save).not.toHaveBeenCalled();
  });

  it('persists a canonical catalog update when the expected version matches', async () => {
    const row = product();
    manager.findOne.mockResolvedValue(row);
    const service = new CatalogContractService(
      repo as never,
      products as never,
    );

    const saved = await service.updateCatalog('id', catalogDto());

    expect(saved).toMatchObject({
      category: 'کفش عروس',
      categorySlug: 'bridal-shoes',
      parentCategory: 'کفش، کتونی و کیف',
      parentCategorySlug: 'bridal-shoes-bags',
      isNewImport: false,
    });
    expect(manager.save).toHaveBeenCalledTimes(1);
  });
});
