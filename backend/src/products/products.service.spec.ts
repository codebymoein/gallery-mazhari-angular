import { ProductEntity } from './entities/product.entity';
import { ProductsService } from './products.service';

const product = (value: Partial<ProductEntity>): ProductEntity => ({
  id: value.code || 'id', code: 'X', name: 'name', category: 'cat',
  parentCategory: 'parent', parentCategorySlug: 'parent', categorySlug: 'cat',
  stock: 1, isNewImport: false, status: 'waiting_photo', photos: [],
  productType: 'simple', reservedStock: 0, lowStockThreshold: 2,
  createdAt: new Date(), updatedAt: new Date(), ...value,
} as ProductEntity);

describe('ProductsService daily inventory authority', () => {
  it('preserves trash/admin taxonomy, parks missing stock, restores workflow, and holds new products', async () => {
    const rejected = product({ code: 'TRASH', status: 'rejected', stock: 4 });
    const published = product({ code: 'LIVE', status: 'published', stock: 2 });
    const queued = product({ code: 'QUEUE', status: 'ready_for_approval', stock: 1, photos: [{ url: 'x', fileName: 'x', addedAt: 'x' }] });
    const restocked = product({ code: 'BACK', status: 'awaiting_stock', stock: 0, enrichment: { inventoryResumeStatus: 'ready_for_approval' } });
    const unresolvedNew = product({ code: 'NEW-OLD', status: 'waiting_photo', isNewImport: true, categorySlug: 'admin-category' });
    const saved: ProductEntity[] = [];
    let findCall = 0;
    const repo = {
      find: jest.fn(async (options?: unknown) => {
        if (!options) return [];
        findCall += 1;
        return findCall === 1 ? [rejected, published, queued] : [restocked, unresolvedNew];
      }),
      save: jest.fn(async (row: ProductEntity) => { saved.push(row); return row; }),
      create: jest.fn((row: Partial<ProductEntity>) => product(row)),
      delete: jest.fn(),
    };
    const variations = { find: jest.fn(async () => []), save: jest.fn(), remove: jest.fn() };
    const service = new ProductsService(repo as never, variations as never, {} as never);

    const result = await service.applyImport({
      products: [
        { code: 'BACK', name: 'back', category: 'excel', categorySlug: 'excel', stock: 3 },
        { code: 'NEW-OLD', name: 'updated', category: 'excel', categorySlug: 'excel', stock: 2, isNewImport: false },
        { code: 'BRAND-NEW', name: 'brand new', category: 'excel', categorySlug: 'excel', stock: 1, isNewImport: false },
        { code: 'ZERO-UNKNOWN', name: 'zero', category: 'excel', stock: 0 },
      ],
      removedOutOfStock: ['TRASH', 'LIVE', 'QUEUE'],
    });

    expect(rejected).toMatchObject({ status: 'rejected', stock: 4 });
    expect(published).toMatchObject({ status: 'awaiting_stock', stock: 0 });
    expect(published.enrichment?.['inventoryResumeStatus']).toBe('published');
    expect(queued.enrichment?.['inventoryResumeStatus']).toBe('ready_for_approval');
    expect(restocked.status).toBe('ready_for_approval');
    expect(unresolvedNew).toMatchObject({ isNewImport: true, categorySlug: 'admin-category', stock: 2 });
    const brandNew = saved.find(row => row.code === 'BRAND-NEW');
    expect(brandNew).toMatchObject({ isNewImport: true, status: 'waiting_photo' });
    expect(saved.some(row => row.code === 'ZERO-UNKNOWN')).toBe(false);
    expect(repo.delete).not.toHaveBeenCalled();
    expect(result.added).toBe(1);
  });

  it('ends the new-product hold only after explicit admin categorization', async () => {
    const row = product({ code: 'N', isNewImport: true, parentCategorySlug: 'new-products' });
    const repo = { findOne: jest.fn(async () => row), save: jest.fn(async (p: ProductEntity) => p) };
    const service = new ProductsService(repo as never, {} as never, {} as never);
    await service.updateCatalog('N', { category: 'لباس', categorySlug: 'dress', parentCategory: 'پوشاک', parentCategorySlug: 'clothing' });
    expect(row.isNewImport).toBe(false);
  });
});
