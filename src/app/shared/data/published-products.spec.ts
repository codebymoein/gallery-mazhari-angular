import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { environment } from '@env/environment';
import type { StagingProduct } from '@shared/models/staging-product.model';
import { getPublishedProducts } from './published-products';

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

const product = (id: string, code: string): StagingProduct => ({
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
  importedAt: '2026-08-07T00:00:00.000Z'
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
});
