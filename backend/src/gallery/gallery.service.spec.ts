import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { GalleryService } from './gallery.service';
import { GalleryItemEntity } from './entities/gallery-item.entity';

describe('GalleryService', () => {
  let service: GalleryService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GalleryService,
        {
          provide: getRepositoryToken(GalleryItemEntity),
          useValue: {
            findAndCount: jest.fn(),
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            remove: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<GalleryService>(GalleryService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
