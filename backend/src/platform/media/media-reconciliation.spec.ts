import { MediaService } from './media.service';

describe('MediaService.reconciliationReport', () => {
  it('reports missing binaries, dangling attachments and legacy references', async () => {
    const hashA = 'a'.repeat(64);
    const hashB = 'b'.repeat(64);
    const hashC = 'c'.repeat(64);
    const keyA = `public/aa/${hashA}.jpg`;
    const derivativeKey = `public/bb/${hashB}.webp`;

    const media = {
      find: jest.fn().mockResolvedValue([
        {
          id: 'asset-1',
          storedFileName: keyA,
          contentHash: hashA,
          derivatives: { 'thumb.webp': `https://media.test/${derivativeKey}` },
          status: 'attached',
          productId: 'product-1',
        },
        {
          id: 'asset-legacy',
          storedFileName: 'uploads/legacy.jpg',
          contentHash: hashB,
          derivatives: null,
          status: 'orphan',
          productId: null,
        },
      ]),
    };
    const products = {
      find: jest.fn().mockResolvedValue([
        {
          id: 'product-1',
          code: 'GM-1',
          photos: [{ contentHash: hashC }],
        },
      ]),
    };
    const storage = {
      exists: jest.fn((key: string) => Promise.resolve(key !== derivativeKey)),
    };

    const service = new MediaService(
      media as never,
      products as never,
      {} as never,
      storage as never,
      {} as never,
    );

    const report = await service.reconciliationReport();

    expect(report.checkedAssets).toBe(2);
    expect(report.missingStorageKeys).toEqual([]);
    expect(report.missingDerivativeKeys).toEqual([derivativeKey]);
    expect(report.danglingAttachedAssets).toEqual(['asset-1']);
    expect(report.productPhotoWithoutAsset).toEqual([`GM-1:${hashC}`]);
    expect(report.legacyStorageReferences).toEqual(['asset-legacy']);
    expect(report.storageErrors).toEqual([]);
  });

  it('records storage provider errors instead of treating them as missing', async () => {
    const hash = 'd'.repeat(64);
    const key = `private/dd/${hash}.bin`;
    const media = {
      find: jest.fn().mockResolvedValue([
        {
          id: 'asset-1',
          storedFileName: key,
          contentHash: hash,
          derivatives: null,
          status: 'quarantine',
          productId: null,
        },
      ]),
    };
    const products = { find: jest.fn().mockResolvedValue([]) };
    const storage = {
      exists: jest.fn().mockRejectedValue(new Error('provider offline')),
    };
    const service = new MediaService(
      media as never,
      products as never,
      {} as never,
      storage as never,
      {} as never,
    );

    const report = await service.reconciliationReport();

    expect(report.missingStorageKeys).toEqual([]);
    expect(report.storageErrors).toEqual([`${key}:provider_offline`]);
  });
});
