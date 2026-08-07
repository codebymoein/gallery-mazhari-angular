import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { environment } from '@env/environment';
import type { StagingProduct } from '@shared/models/staging-product.model';
import {
  getPublishedProductById,
  getPublishedProducts,
  getStagedProductById,
  publishedProductsForSlug,
  toCatalogProduct
} from './published-products';

const memory = new Map<string, string>();
const storage: Storage = {
  get length() {
    return memory.size;
  },
  clear: () => memory.clear(),
  getItem: (key: string) => memory.get(key) ?? null,
  key: (index: number) => [...memory.keys()][index] ?? null,
  removeItem: (key: string) => {
    memory.delete(key);
  },
  setItem: (key: string, value: string) => {
    memory.set(key, value);
  }
};

Object.defineProperty(globalThis, 'localStorage', {
  configurable: true,
  value: storage
});

const product = (
  id: string,
  code: string,
  overrides: Partial<StagingProduct> = {}
): StagingProduct => ({
  id,
  code,
  name: code,
  category: 'کفش عروس',
  parentCategory: 'کفش، کتونی و کیف',
  parentCategorySlug: 'bridal-shoes-bags',
  categorySlug: 'bridal-shoes',
  stock: 1,
  status: 'published',
  photos: [],
  importedAt: '2026-08-07T00:00:00.000Z',
  ...overrides
});

function writeCache(products: StagingProduct[], expiresAt: string, revision: string): void {
  localStorage.setItem(environment.storageKeys.publishedProducts, JSON.stringify({
    revision,
    generatedAt: '2026-08-07T00:00:00.000Z',
    cachedAt: '2026-08-07T00:00:00.000Z',
    expiresAt,
    products
  }));
}

describe('published storefront catalog authority', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('never merges a local-only staging product into the public catalog', () => {
    vi.spyOn(Date, 'now').mockReturnValue(Date.parse('2026-08-07T00:00:10.000Z'));
    writeCache(
      [product('server-id', 'SERVER')],
      '2026-08-07T00:01:00.000Z',
      'revision-server-only'
    );
    localStorage.setItem(
      environment.storageKeys.stagingQueue,
      JSON.stringify([product('local-id', 'LOCAL-ONLY')])
    );

    expect(getPublishedProducts().map(item => item.code)).toEqual(['SERVER']);
  });

  it('does not expose an expired server projection', () => {
    vi.spyOn(Date, 'now').mockReturnValue(Date.parse('2026-08-07T00:02:00.000Z'));
    writeCache(
      [product('expired-id', 'EXPIRED')],
      '2026-08-07T00:01:00.000Z',
      'revision-expired'
    );

    expect(getPublishedProducts()).toEqual([]);
  });

  it('re-evaluates TTL even when the localStorage payload has not changed', () => {
    const now = vi.spyOn(Date, 'now');
    now.mockReturnValue(Date.parse('2026-08-07T00:00:10.000Z'));
    writeCache(
      [product('ttl-id', 'TTL')],
      '2026-08-07T00:00:30.000Z',
      'revision-ttl-memo'
    );

    expect(getPublishedProducts().map(item => item.code)).toEqual(['TTL']);

    now.mockReturnValue(Date.parse('2026-08-07T00:00:31.000Z'));
    expect(getPublishedProducts()).toEqual([]);
  });

  it('filters unpublished and zero-stock rows and supports public lookup helpers', () => {
    vi.spyOn(Date, 'now').mockReturnValue(Date.parse('2026-08-07T00:00:10.000Z'));
    writeCache(
      [
        product('shoe-id', 'SHOE-7', {
          name: 'MODEL-7 کفش',
          material: 'ساتن',
          size: '38',
          photos: [{ url: '/shoe.webp', fileName: 'shoe.webp', addedAt: 'now' }]
        }),
        product('veil-id', 'VEIL', {
          category: 'تور',
          categorySlug: 'simple-veil',
          parentCategorySlug: 'bridal-clothing'
        }),
        product('draft-id', 'DRAFT', { status: 'waiting_photo' }),
        product('zero-id', 'ZERO', { stock: 0 })
      ],
      '2026-08-07T00:01:00.000Z',
      'revision-lookups'
    );

    expect(getPublishedProducts().map(item => item.code)).toEqual(['SHOE-7', 'VEIL']);
    expect(getPublishedProductById('shoe-id')?.code).toBe('SHOE-7');
    expect(getPublishedProductById('shoe-7')?.id).toBe('shoe-id');
    expect(publishedProductsForSlug('bridal-shoes-bags').map(item => item.code)).toEqual(['SHOE-7']);
    expect(getStagedProductById('veil-id')?.categorySlug).toBe('european-bridal-veils');
    expect(getStagedProductById('missing')).toBeUndefined();
  });

  it('maps catalog presentation fields, variations, legacy slugs and inferred footwear height', () => {
    const mapped = toCatalogProduct(product('mapped-id', 'MAP', {
      name: 'MODEL-8 کفش عروس',
      categorySlug: 'bridal-shoes',
      material: 'چرم',
      description: 'توضیح',
      additionalDescription: 'توضیح بیشتر',
      isNewImport: true,
      photos: [
        { url: '/primary.webp', fileName: 'primary.webp', addedAt: 'now' },
        { url: '/gallery.webp', fileName: 'gallery.webp', addedAt: 'now' }
      ],
      variations: [{
        id: 'variation-id',
        sku: 'SKU',
        barcode: 'BAR',
        size: '39',
        color: 'سفید',
        material: 'چرم',
        price: 100,
        stock: 2,
        available: true
      }]
    }));

    expect(mapped).toMatchObject({
      image: '/primary.webp',
      heelHeight: '8 سانتی‌متر',
      material: 'چرم',
      description: 'توضیح',
      additionalDescription: 'توضیح بیشتر',
      tag: 'محصول جدید وارد شده'
    });
    expect(mapped.gallery).toEqual(['/primary.webp', '/gallery.webp']);
    expect(mapped.variations?.[0]).toMatchObject({ sku: 'SKU', stock: 2 });

    const legacy = toCatalogProduct(product('legacy-id', 'LEGACY', {
      categorySlug: 'short-veil',
      parentCategorySlug: ''
    }));
    expect(legacy.categorySlug).toBe('european-bridal-veils');
  });

  it('rejects legacy raw arrays and malformed cache envelopes as public authority', () => {
    vi.spyOn(Date, 'now').mockReturnValue(Date.parse('2026-08-07T00:00:10.000Z'));
    localStorage.setItem(
      environment.storageKeys.publishedProducts,
      JSON.stringify([product('legacy-array', 'LEGACY-ARRAY')])
    );
    expect(getPublishedProducts()).toEqual([]);

    localStorage.setItem(environment.storageKeys.publishedProducts, '{bad-json');
    expect(getPublishedProducts()).toEqual([]);
  });
});
