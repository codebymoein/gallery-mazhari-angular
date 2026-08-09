import { ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GalleryController } from './gallery.controller';
import { GalleryService } from './gallery.service';

jest.mock('sharp', () => {
  throw new Error('unsupported test CPU');
});

describe('GalleryController image runtime isolation', () => {
  it('loads without eagerly requiring sharp', () => {
    expect(GalleryController).toBeDefined();
  });

  it('fails the upload closed when image processing is unavailable', async () => {
    const controller = new GalleryController(
      {} as GalleryService,
      { get: jest.fn() } as unknown as ConfigService,
    );

    await expect(
      controller.uploadImage({ buffer: Buffer.from('not-an-image') }),
    ).rejects.toBeInstanceOf(ServiceUnavailableException);
  });
});
