import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';
import { Repository } from 'typeorm';
import { UpdateAppearanceDto } from './dto/update-appearance.dto';
import { SiteAppearanceEntity } from './entities/site-appearance.entity';

const DATA_IMAGE = /^data:(image\/(?:jpeg|png|webp|avif));base64,(.+)$/i;
const EXT: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/avif': '.avif',
};

@Injectable()
export class AppearanceService {
  constructor(
    @InjectRepository(SiteAppearanceEntity)
    private readonly repo: Repository<SiteAppearanceEntity>,
  ) {}

  async get(): Promise<SiteAppearanceEntity> {
    return (
      (await this.repo.findOne({ where: { id: 1 } })) ??
      this.repo.create({
        id: 1,
        bridalHeroImage: null,
        accessoryHeroImage: null,
        categoryImages: {},
        subcategoryImages: {},
        consultationImage: null,
        memories: [],
        categoryOrder: [],
        subcategoryOrder: {},
      })
    );
  }

  async update(
    dto: UpdateAppearanceDto,
    baseUrl: string,
  ): Promise<SiteAppearanceEntity> {
    const current = await this.get();
    if (dto.bridalHeroImage !== undefined)
      current.bridalHeroImage = this.persist(
        dto.bridalHeroImage,
        'hero',
        baseUrl,
      );
    if (dto.accessoryHeroImage !== undefined)
      current.accessoryHeroImage = this.persist(
        dto.accessoryHeroImage,
        'hero',
        baseUrl,
      );
    if (dto.categoryImages) {
      current.categoryImages = this.persistMap(
        dto.categoryImages,
        current.categoryImages ?? {},
        'category',
        baseUrl,
      );
    }
    if (dto.subcategoryImages) {
      current.subcategoryImages = this.persistMap(
        dto.subcategoryImages,
        current.subcategoryImages ?? {},
        'subcategory',
        baseUrl,
      );
    }
    if (dto.categoryOrder)
      current.categoryOrder = dto.categoryOrder.map(String).slice(0, 50);
    if (dto.subcategoryOrder) current.subcategoryOrder = dto.subcategoryOrder;
    if (dto.consultationImage !== undefined)
      current.consultationImage = this.persist(
        dto.consultationImage,
        'consultation',
        baseUrl,
      );
    if (dto.memories) {
      current.memories = dto.memories.slice(0, 12).map((item, index) => ({
        id: String(item.id || `memory-${Date.now()}-${index}`),
        name: String(item.name || '').slice(0, 120),
        quote: String(item.quote || '').slice(0, 1000),
        venue: String(item.venue || '').slice(0, 160),
        image: item.image ? this.persist(item.image, 'memory', baseUrl) : '',
        span: ['tall', 'wide', 'square'].includes(item.span)
          ? item.span
          : 'square',
        active: item.active !== false,
      }));
    }
    return this.repo.save(current);
  }

  private persistMap(
    input: Record<string, string>,
    existing: Record<string, string>,
    prefix: string,
    baseUrl: string,
  ) {
    const output = { ...existing };
    for (const [key, value] of Object.entries(input)) {
      if (!value) delete output[key];
      else output[key] = this.persist(value, prefix, baseUrl);
    }
    return output;
  }

  private persist(value: string, prefix: string, baseUrl: string): string {
    if (!value.startsWith('data:')) return value.slice(0, 500);
    const match = DATA_IMAGE.exec(value);
    if (!match) throw new BadRequestException('فرمت تصویر پشتیبانی نمی‌شود.');
    const buffer = Buffer.from(match[2], 'base64');
    if (buffer.length > 8 * 1024 * 1024)
      throw new BadRequestException('حجم تصویر باید کمتر از ۸ مگابایت باشد.');
    const dir = join(process.cwd(), 'uploads', 'appearance');
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
    const name = `${prefix}-${Date.now()}-${Math.round(Math.random() * 1e7)}${EXT[match[1].toLowerCase()]}`;
    writeFileSync(join(dir, name), buffer);
    return `${baseUrl}/uploads/appearance/${name}`;
  }
}
