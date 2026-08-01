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
import {
  OverrideStatusDto,
  PublishProductDto,
} from './dto/publish-product.dto';
import {
  ProductEntity,
  ProductPhoto,
  ProductStatus,
} from './entities/product.entity';
import { ProductVariationEntity } from '../platform/import/entities/product-variation.entity';
import { DiscountsService } from '../discounts/discounts.service';

export const MAX_PRODUCT_PHOTOS = 5;

const DATA_URL_PATTERN = /^data:(image\/[a-z0-9.+-]+);base64,(.+)$/i;

const EXTENSION_BY_MIME: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
  'image/avif': '.avif',
};

function inferFootwearMeasurements(
  name: string,
  categorySlug: string,
): { heelHeight?: string; platformHeight?: string } {
  const model = name.trim().split(/\s+/)[0] || '';
  const match = /-(\d+(?:[.,]\d+)?)$/.exec(model);
  if (!match) return {};
  const height = `${match[1].replace(',', '.')} سانتی‌متر`;
  if (categorySlug === 'bridal-shoes') return { heelHeight: height };
  if (categorySlug === 'bridal-sneakers') return { platformHeight: height };
  return {};
}

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(ProductEntity)
    private readonly repo: Repository<ProductEntity>,
    @InjectRepository(ProductVariationEntity)
    private readonly variations: Repository<ProductVariationEntity>,
    private readonly discounts: DiscountsService,
  ) {}

  getQueue(): Promise<ProductEntity[]> {
    return this.repo.find({ order: { createdAt: 'DESC' } });
  }

  async getPublished(): Promise<
    Array<ProductEntity & { variations?: ProductVariationEntity[] }>
  > {
    const products = await this.repo
      .createQueryBuilder('p')
      .where('p.status = :status', { status: 'published' })
      .andWhere('p.stock > 0')
      .orderBy('p.publishedAt', 'DESC')
      .getMany();
    const variableProducts = products.filter(
      (p) => p.productType === 'variable',
    );
    if (!variableProducts.length)
      return this.discounts.applyToProducts(products);

    const rows = await this.variations.find({
      where: { parentProductId: In(variableProducts.map((p) => p.id)) },
      order: { size: 'ASC', color: 'ASC' },
    });
    const byParent = new Map<string, ProductVariationEntity[]>();
    for (const row of rows) {
      if (!row.available || row.stock <= 0) continue;
      const list = byParent.get(row.parentProductId) ?? [];
      list.push(row);
      byParent.set(row.parentProductId, list);
    }
    const enriched = products.map((product) =>
      Object.assign(product, {
        variations: byParent.get(product.id) ?? [],
      }),
    );
    return this.discounts.applyToProducts(enriched);
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
    const incomingCodes = dto.products.map((p) => p.code.trim().toUpperCase());
    const positiveCodeSet = new Set(incomingCodes);
    const removeCodes = [
      ...new Set(dto.removedOutOfStock.map((c) => c.trim().toUpperCase())),
    ].filter((code) => Boolean(code) && !positiveCodeSet.has(code));

    let removed = 0;
    if (removeCodes.length) {
      const zeroStockProducts = await this.repo.find({
        where: { code: In(removeCodes) },
      });
      const removableIds: string[] = [];
      for (const product of zeroStockProducts) {
        if (
          product.status === 'published' ||
          product.status === 'awaiting_stock'
        ) {
          product.stock = 0;
          product.status = 'awaiting_stock';
          product.isNewImport = false;
          product.inventoryUpdatedAt = new Date().toISOString();
          await this.repo.save(product);
        } else if (product.status !== 'rejected') {
          removableIds.push(product.id);
        }
      }
      if (removableIds.length) {
        const result = await this.repo.delete({ id: In(removableIds) });
        removed = result.affected ?? 0;
      }
    }

    const existing = incomingCodes.length
      ? await this.repo.find({ where: { code: In(incomingCodes) } })
      : [];
    const existingByCode = new Map(
      existing.map((e) => [e.code.toUpperCase(), e]),
    );

    let added = 0;
    let updated = 0;
    const now = new Date().toISOString();

    for (const row of dto.products) {
      const code = row.code.trim().toUpperCase();
      const current = existingByCode.get(code);

      if (current) {
        // زباله‌دان از چرخه به‌روزرسانی اکسل خارج است.
        if (current.status === 'rejected') continue;
        current.name = row.name.trim();
        current.category = row.category;
        current.parentCategory = row.parentCategory ?? current.parentCategory;
        current.parentCategorySlug =
          row.parentCategorySlug ?? current.parentCategorySlug;
        current.categorySlug = row.categorySlug ?? current.categorySlug;
        current.stock = row.stock;
        if (row.status === 'rejected') {
          current.trashedFromStatus = current.status;
          current.status = 'rejected';
        }
        if (current.status === 'awaiting_stock' && row.stock > 0) {
          current.status = 'published';
        }
        current.inventoryUpdatedAt = now;
        if (row.price !== undefined) current.price = row.price;
        current.isNewImport = row.isNewImport ?? current.isNewImport;
        if (row.size !== undefined) current.size = row.size || null;
        if (row.material !== undefined) current.material = row.material || null;
        current.enrichment = {
          ...(current.enrichment ?? {}),
          ...inferFootwearMeasurements(current.name, current.categorySlug),
          ...(row.heelHeight ? { heelHeight: row.heelHeight } : {}),
          ...(row.platformHeight ? { platformHeight: row.platformHeight } : {}),
          ...(row.variantKey ? { variantKey: row.variantKey } : {}),
        };
        current.productType = row.variations?.length ? 'variable' : 'simple';
        const saved = await this.repo.save(current);
        await this.syncVariations(saved, row.variations ?? [], now);
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
        price: row.price ?? null,
        isNewImport: row.isNewImport ?? false,
        size: row.size || null,
        material: row.material || null,
        enrichment: {
          ...inferFootwearMeasurements(row.name.trim(), row.categorySlug ?? ''),
          ...(row.heelHeight ? { heelHeight: row.heelHeight } : {}),
          ...(row.platformHeight ? { platformHeight: row.platformHeight } : {}),
          ...(row.variantKey ? { variantKey: row.variantKey } : {}),
        },
        status: row.status ?? 'waiting_photo',
        photos: [],
        importedAt: now,
        productType: row.variations?.length ? 'variable' : 'simple',
      });
      const saved = await this.repo.save(fresh);
      await this.syncVariations(saved, row.variations ?? [], now);
      existingByCode.set(code, saved);
      added += 1;
    }

    return { added, updated, removed, queue: await this.getQueue() };
  }

  private async syncVariations(
    parent: ProductEntity,
    rows: Array<{
      sku: string;
      barcode: string;
      size?: string;
      color?: string;
      material?: string;
      price?: number;
      stock: number;
      available: boolean;
    }>,
    importId: string,
  ): Promise<void> {
    const existing = await this.variations.find({
      where: { parentProductId: parent.id },
    });
    if (!rows.length) {
      if (existing.length) await this.variations.remove(existing);
      return;
    }
    const byBarcode = new Map(existing.map((item) => [item.barcode, item]));
    const incomingBarcodes = new Set(rows.map((row) => row.barcode));
    for (const row of rows) {
      const variation =
        byBarcode.get(row.barcode) ??
        this.variations.create({
          parentProductId: parent.id,
          parentCode: parent.code,
          sku: row.sku,
          barcode: row.barcode,
          reservedStock: 0,
          photos: null,
          status: 'active',
        });
      variation.sku = row.sku;
      variation.size = row.size || null;
      variation.color = row.color || null;
      variation.material = row.material || null;
      variation.price = row.price ?? parent.price ?? null;
      variation.stock = row.stock;
      variation.available = row.available && row.stock > 0;
      variation.importId = importId;
      await this.variations.save(variation);
    }
    const stale = existing.filter(
      (item) => !incomingBarcodes.has(item.barcode),
    );
    if (stale.length) await this.variations.remove(stale);
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
    // افزودن عکس به‌تنهایی محصول را برای مدیر ارسال نمی‌کند؛ ارسال صریح از پنل انجام می‌شود.
    product.status = 'waiting_photo';
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

  async setPrimaryPhoto(id: string, index: number): Promise<ProductEntity> {
    const product = await this.getById(id);
    const photos = [...(product.photos ?? [])];
    if (index < 0 || index >= photos.length) {
      throw new BadRequestException('ایندکس عکس نامعتبر است.');
    }
    const [primary] = photos.splice(index, 1);
    product.photos = [
      { ...primary, role: 'primary' },
      ...photos.map((photo) => ({ ...photo, role: 'gallery' as const })),
    ];
    return this.repo.save(product);
  }

  async publish(id: string, dto: PublishProductDto): Promise<ProductEntity> {
    const product = await this.getById(id);
    if (product.status !== 'ready_for_approval') {
      throw new BadRequestException(
        'فقط محصولات آماده‌ی تایید قابل انتشار هستند.',
      );
    }
    if (
      product.categorySlug === 'bridal-shoes' ||
      product.categorySlug === 'bridal-sneakers'
    ) {
      const availableSizes = await this.variations.count({
        where: { parentProductId: product.id, available: true },
      });
      if (availableSizes === 0) {
        throw new BadRequestException(
          'انتشار کفش و کتونی بدون سایز دارای موجودی مجاز نیست. فایل موجودی را دوباره بارگذاری کنید.',
        );
      }
    }
    product.status = 'published';
    product.publishedAt = new Date().toISOString();
    product.publishedBy = dto.publishedBy ?? null;
    return this.repo.save(product);
  }

  async unpublish(id: string, actor?: string): Promise<ProductEntity> {
    const product = await this.getById(id);
    if (product.status !== 'published' && product.status !== 'awaiting_stock') {
      throw new BadRequestException(
        'فقط محصول منتشرشده قابل بازگشت به صف انتشار است.',
      );
    }
    product.status = (product.photos ?? []).length
      ? 'ready_for_approval'
      : 'waiting_photo';
    product.publishedAt = null;
    product.publishedBy = null;
    product.processedAt = new Date().toISOString();
    product.processedBy = actor ?? null;
    product.notes = actor
      ? `محصول توسط ${actor} از سایت برداشته و به صف بازگردانده شد`
      : 'محصول از سایت برداشته و به صف بازگردانده شد';
    return this.repo.save(product);
  }

  async overrideStatus(
    id: string,
    dto: OverrideStatusDto,
  ): Promise<ProductEntity> {
    const product = await this.getById(id);
    if (dto.status === 'ready_for_approval' && !(product.photos ?? []).length) {
      throw new BadRequestException(
        'محصول بدون عکس قابل ارسال برای مدیر نیست.',
      );
    }
    const previousStatus = product.status;
    if (dto.status === 'rejected' && previousStatus !== 'rejected') {
      product.trashedFromStatus = previousStatus;
    } else if (previousStatus === 'rejected' && dto.status !== 'rejected') {
      product.trashedFromStatus = null;
    }
    product.status = dto.status;
    product.notes = dto.actor
      ? `وضعیت توسط ${dto.actor} تغییر کرد`
      : product.notes;

    if (dto.status === 'published') {
      product.publishedAt = new Date().toISOString();
      product.publishedBy = dto.actor ?? null;
    }
    if (dto.status === 'ready_for_approval') {
      product.processedAt = new Date().toISOString();
      product.processedBy = dto.actor ?? null;
    }
    return this.repo.save(product);
  }

  async restoreProducts(rows: Array<Record<string, unknown>>): Promise<{
    restored: number;
    queue: ProductEntity[];
  }> {
    if (!Array.isArray(rows) || rows.length > 20000) {
      throw new BadRequestException('backup_products_invalid');
    }
    let restored = 0;
    for (const row of rows) {
      const code = String(row['code'] || '')
        .trim()
        .toUpperCase();
      const name = String(row['name'] || '').trim();
      if (!code || !name) continue;
      const current = await this.repo.findOne({ where: { code } });
      const target = current ?? this.repo.create({ code, photos: [] });
      target.name = name;
      target.category = String(row['category'] || 'نامشخص').slice(0, 120);
      target.parentCategory = String(row['parentCategory'] || '').slice(0, 120);
      target.parentCategorySlug = String(row['parentCategorySlug'] || '').slice(
        0,
        120,
      );
      target.categorySlug = String(row['categorySlug'] || '').slice(0, 120);
      target.stock = Math.max(0, Number(row['stock']) || 0);
      target.price =
        row['price'] == null ? null : Math.max(0, Number(row['price']) || 0);
      target.isNewImport = Boolean(row['isNewImport']);
      target.status = String(row['status'] || 'waiting_photo') as ProductStatus;
      target.photos = Array.isArray(row['photos'])
        ? (row['photos'] as ProductPhoto[]).slice(0, 12)
        : [];
      target.size = row['size'] ? String(row['size']).slice(0, 40) : null;
      target.material = row['material']
        ? String(row['material']).slice(0, 80)
        : null;
      target.importedAt = row['importedAt']
        ? String(row['importedAt']).slice(0, 40)
        : new Date().toISOString();
      target.processedAt = row['processedAt']
        ? String(row['processedAt']).slice(0, 40)
        : null;
      target.publishedAt = row['publishedAt']
        ? String(row['publishedAt']).slice(0, 40)
        : null;
      target.processedBy = row['processedBy']
        ? String(row['processedBy']).slice(0, 120)
        : null;
      target.publishedBy = row['publishedBy']
        ? String(row['publishedBy']).slice(0, 120)
        : null;
      target.notes = row['notes'] ? String(row['notes']).slice(0, 300) : null;
      target.enrichment = {
        ...(target.enrichment ?? {}),
        ...inferFootwearMeasurements(target.name, target.categorySlug),
        ...(row['heelHeight'] ? { heelHeight: String(row['heelHeight']) } : {}),
        ...(row['platformHeight']
          ? { platformHeight: String(row['platformHeight']) }
          : {}),
        ...(row['variantKey'] ? { variantKey: String(row['variantKey']) } : {}),
        hiddenTags: Array.isArray(row['hiddenTags'])
          ? (row['hiddenTags'] as unknown[]).map(String).slice(0, 100)
          : [],
      };
      await this.repo.save(target);
      restored += 1;
    }
    return { restored, queue: await this.getQueue() };
  }

  async updateCatalog(
    id: string,
    dto: {
      category: string;
      categorySlug: string;
      parentCategory: string;
      parentCategorySlug: string;
      collection?: string;
      hiddenTags?: string[];
    },
  ): Promise<ProductEntity> {
    const product = await this.getById(id);
    product.category = dto.category.trim();
    product.categorySlug = dto.categorySlug.trim();
    product.parentCategory = dto.parentCategory.trim();
    product.parentCategorySlug = dto.parentCategorySlug.trim();
    if (dto.collection !== undefined)
      product.collection = dto.collection.trim() || null;
    if (dto.hiddenTags !== undefined) {
      product.enrichment = {
        ...(product.enrichment ?? {}),
        hiddenTags: [
          ...new Set(dto.hiddenTags.map((tag) => tag.trim()).filter(Boolean)),
        ],
      };
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
