import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';
import { In, Repository } from 'typeorm';
import { AttachPhotosDto } from './dto/attach-photos.dto';
import { ImportProductsDto } from './dto/import-products.dto';
import { OverrideStatusDto, PublishProductDto } from './dto/publish-product.dto';
import {
  ProductEntity,
  ProductPhoto,
  ProductStatus,
} from './entities/product.entity';

export const MAX_PRODUCT_PHOTOS = 5;

const DATA_URL_PATTERN = /^data:(image\/[a-z0-9.+-]+);base64,(.+)$/i;

const EXTENSION_BY_MIME: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
  'image/avif': '.avif',
};

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(ProductEntity)
    private readonly repo: Repository<ProductEntity>,
  ) {}

  getQueue(): Promise<ProductEntity[]> {
    return this.repo.find({ order: { createdAt: 'DESC' } });
  }

  getPublished(): Promise<ProductEntity[]> {
    return this.repo
      .createQueryBuilder('p')
      .where('p.status = :status', { status: 'published' })
      .andWhere('p.stock > 0')
      .orderBy('p.publishedAt', 'DESC')
      .getMany();
  }

  /**
   * اعمال نتیجه اکسل: حذف کامل ناموجودها + upsert موجودی‌دارها بر اساس کد کالا.
   * محصولات موجود عکس/وضعیت خود را حفظ می‌کنند و فقط مشخصات به‌روزرسانی می‌شود.
   */
  async applyImport(dto: ImportProductsDto): Promise<{
    added: number;
    updated: number;
    removed: number;
    queue: ProductEntity[];
  }> {
    const removeCodes = [
      ...new Set(dto.removedOutOfStock.map((c) => c.trim().toUpperCase())),
    ].filter(Boolean);

    let removed = 0;
    if (removeCodes.length) {
      const result = await this.repo.delete({ code: In(removeCodes) });
      removed = result.affected ?? 0;
    }

    const incomingCodes = dto.products.map((p) => p.code.trim().toUpperCase());
    const existing = incomingCodes.length
      ? await this.repo.find({ where: { code: In(incomingCodes) } })
      : [];
    const existingByCode = new Map(existing.map((e) => [e.code.toUpperCase(), e]));

    let added = 0;
    let updated = 0;
    const now = new Date().toISOString();

    for (const row of dto.products) {
      const code = row.code.trim().toUpperCase();
      const current = existingByCode.get(code);

      if (current) {
        current.name = row.name.trim();
        current.category = row.category;
        current.parentCategory = row.parentCategory ?? current.parentCategory;
        current.parentCategorySlug =
          row.parentCategorySlug ?? current.parentCategorySlug;
        current.categorySlug = row.categorySlug ?? current.categorySlug;
        current.stock = row.stock;
        current.isNewImport = row.isNewImport ?? current.isNewImport;
        await this.repo.save(current);
        updated += 1;
        continue;
      }

      const fresh = this.repo.create({
        code,
        name: row.name.trim(),
        category: row.category,
        parentCategory: row.parentCategory ?? '',
        parentCategorySlug: row.parentCategorySlug ?? '',
        categorySlug: row.categorySlug ?? '',
        stock: row.stock,
        isNewImport: row.isNewImport ?? false,
        status: 'waiting_photo',
        photos: [],
        importedAt: now,
      });
      await this.repo.save(fresh);
      added += 1;
    }

    return { added, updated, removed, queue: await this.getQueue() };
  }

  async attachPhotos(
    id: string,
    dto: AttachPhotosDto,
    uploadsBaseUrl: string,
  ): Promise<ProductEntity> {
    const product = await this.getById(id);
    const existing = product.photos ?? [];
    const room = MAX_PRODUCT_PHOTOS - existing.length;
    if (room <= 0) {
      throw new BadRequestException(
        `حداکثر ${MAX_PRODUCT_PHOTOS} عکس برای هر محصول مجاز است.`,
      );
    }

    const slice = dto.photos.slice(0, room).map((photo): ProductPhoto => {
      return {
        url: this.persistPhotoUrl(photo.url, uploadsBaseUrl),
        fileName: photo.fileName,
        addedAt: new Date().toISOString(),
      };
    });

    product.photos = [...existing, ...slice];
    product.status = 'ready_for_approval';
    product.processedAt = new Date().toISOString();
    product.processedBy = dto.processedBy ?? null;
    return this.repo.save(product);
  }

  async removePhoto(id: string, index: number): Promise<ProductEntity> {
    const product = await this.getById(id);
    const photos = [...(product.photos ?? [])];
    if (index < 0 || index >= photos.length) {
      throw new BadRequestException('ایندکس عکس نامعتبر است.');
    }
    photos.splice(index, 1);
    product.photos = photos;
    if (photos.length === 0 && product.status === 'ready_for_approval') {
      product.status = 'waiting_photo';
    }
    return this.repo.save(product);
  }

  async publish(id: string, dto: PublishProductDto): Promise<ProductEntity> {
    const product = await this.getById(id);
    if (product.status !== 'ready_for_approval') {
      throw new BadRequestException(
        'فقط محصولات آماده‌ی تایید قابل انتشار هستند.',
      );
    }
    product.status = 'published';
    product.publishedAt = new Date().toISOString();
    product.publishedBy = dto.publishedBy ?? null;
    return this.repo.save(product);
  }

  async overrideStatus(id: string, dto: OverrideStatusDto): Promise<ProductEntity> {
    const product = await this.getById(id);
    product.status = dto.status as ProductStatus;
    product.notes = dto.actor ? `وضعیت توسط ${dto.actor} تغییر کرد` : product.notes;

    if (dto.status === 'published') {
      product.publishedAt = new Date().toISOString();
      product.publishedBy = dto.actor ?? null;
    }
    if (dto.status === 'ready_for_approval') {
      product.processedAt = new Date().toISOString();
      product.processedBy = dto.actor ?? null;
    }
    if (dto.status === 'waiting_photo') {
      product.photos = [];
    }
    return this.repo.save(product);
  }

  private async getById(id: string): Promise<ProductEntity> {
    const product = await this.repo.findOne({ where: { id } });
    if (!product) {
      throw new NotFoundException('محصول یافت نشد.');
    }
    return product;
  }

  /**
   * data:URL های ارسالی از پنل (عکس فشرده‌شده سمت کلاینت) به فایل واقعی در
   * پوشه uploads تبدیل می‌شوند تا در دیتابیس فقط URL ذخیره شود.
   */
  private persistPhotoUrl(url: string, uploadsBaseUrl: string): string {
    const match = DATA_URL_PATTERN.exec(url);
    if (!match) {
      return url;
    }

    const [, mime, base64] = match;
    const buffer = Buffer.from(base64, 'base64');
    if (buffer.length > 8 * 1024 * 1024) {
      throw new BadRequestException('حجم عکس بیش از حد مجاز است.');
    }

    const destination = join(process.cwd(), 'uploads');
    if (!existsSync(destination)) {
      mkdirSync(destination, { recursive: true });
    }

    const ext = EXTENSION_BY_MIME[mime.toLowerCase()] ?? '.jpg';
    const fileName = `product-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    writeFileSync(join(destination, fileName), buffer);

    return `${uploadsBaseUrl}/uploads/${fileName}`;
  }
}
