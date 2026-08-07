import {
  buildContentAddressedMediaKey,
  MediaStorageService,
} from './media-storage.service';

describe('MediaStorageService', () => {
  const hash = 'a'.repeat(64);
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...originalEnv };
    jest.restoreAllMocks();
  });

  it('builds deterministic content-addressed public/private keys', () => {
    expect(buildContentAddressedMediaKey(hash, '.JPG', 'public')).toBe(
      `public/aa/${hash}.jpg`,
    );
    expect(buildContentAddressedMediaKey(hash, 'bin', 'private')).toBe(
      `private/aa/${hash}.bin`,
    );
  });

  it('rejects malformed hashes and extensions before storage', () => {
    expect(() => buildContentAddressedMediaKey('abc', 'jpg', 'public')).toThrow(
      /invalid_media_content_hash/,
    );
    expect(() => buildContentAddressedMediaKey(hash, '../jpg', 'public')).toThrow(
      /invalid_media_extension/,
    );
  });

  it('uses the public media base URL for public S3 objects', async () => {
    configureS3();
    const fetchSpy = jest
      .spyOn(global, 'fetch')
      .mockResolvedValue({ ok: true, status: 200 } as Response);
    const storage = new MediaStorageService();

    const stored = await storage.put({
      buffer: Buffer.from('image'),
      contentHash: hash,
      extension: 'jpg',
      contentType: 'image/jpeg',
      visibility: 'public',
    });

    expect(stored.key).toBe(`public/aa/${hash}.jpg`);
    expect(stored.url).toBe(`https://media.example.test/public/aa/${hash}.jpg`);
    expect(stored.localPath).toBeNull();
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  it('never exposes a public URL for private S3 objects', async () => {
    configureS3();
    jest
      .spyOn(global, 'fetch')
      .mockResolvedValue({ ok: true, status: 200 } as Response);
    const storage = new MediaStorageService();

    const stored = await storage.put({
      buffer: Buffer.from('quarantine'),
      contentHash: hash,
      extension: 'bin',
      contentType: 'application/octet-stream',
      visibility: 'private',
    });

    expect(stored.url).toBe(
      `private-object://gallery-media/private/aa/${hash}.bin`,
    );
    expect(stored.url).not.toContain('media.example.test');
  });

  it('fails visibly when the object store rejects the write', async () => {
    configureS3();
    jest
      .spyOn(global, 'fetch')
      .mockResolvedValue({ ok: false, status: 503 } as Response);
    const storage = new MediaStorageService();

    await expect(
      storage.put({
        buffer: Buffer.from('image'),
        contentHash: hash,
        extension: 'jpg',
        contentType: 'image/jpeg',
        visibility: 'public',
      }),
    ).rejects.toThrow(/media_storage_put_failed:503/);
  });
});

function configureS3(): void {
  process.env.MEDIA_STORAGE_DRIVER = 's3';
  process.env.MEDIA_S3_ENDPOINT = 'https://objects.example.test';
  process.env.MEDIA_S3_REGION = 'auto';
  process.env.MEDIA_S3_BUCKET = 'gallery-media';
  process.env.MEDIA_S3_ACCESS_KEY_ID = 'test-access-key';
  process.env.MEDIA_S3_SECRET_ACCESS_KEY = 'test-secret-key';
  process.env.MEDIA_PUBLIC_BASE_URL = 'https://media.example.test';
}
