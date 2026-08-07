import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { createHash } from 'crypto';
import { Repository } from 'typeorm';
import { assertCanonicalCatalogClassification } from './catalog-taxonomy';
import { UpdateCatalogDto } from './dto/update-catalog.dto';
import { ProductEntity } from './entities/product.entity';
import { ProductsService } from './products.service';

const CATALOG_CACHE_TTL_SECONDS = 60;
const NEW_PRODUCTS_CATEGORY_SLUG = 'new-products';

@Injectable()
export class CatalogContractService {
  constructor(
    @InjectRepository(ProductEntity)
    private readonly repo: Repository<ProductEntity>,
    private readonly products: ProductsService,
  ) {}

  async getPublishedSnapshot() {
    const products = await this.products.getPublished();
    const revision = createHash('sha256')
      .update(JSON.stringify(products))
      .digest('hex')
      .slice(0, 24);

    return {
      revision,
      generatedAt: new Date().toISOString(),
      ttlSeconds: CATALOG_CACHE_TTL_SECONDS,
      products,
    };
  }

  async updateCatalog(
    id: string,
    dto: UpdateCatalogDto,
  ): Promise<ProductEntity> {
    assertCanonicalCatalogClassification(dto);

    return this.repo.manager.transaction(async (manager) => {
      const product = await manager.findOne(ProductEntity, {
        where: { id },
        lock: { mode: 'pessimistic_write' },
      });
      if (!product) throw new NotFoundException('محصول یافت نشد.');

      const currentVersion = product.updatedAt?.toISOString();
      if (!currentVersion || currentVersion !== dto.expectedUpdatedAt) {
        throw new ConflictException({
          code: 'catalog_version_conflict',
          currentUpdatedAt: currentVersion ?? null,
        });
      }

      product.category = dto.category.trim();
      product.categorySlug = dto.categorySlug.trim();
      product.parentCategory = dto.parentCategory.trim();
      product.parentCategorySlug = dto.parentCategorySlug.trim();
      if (product.parentCategorySlug !== NEW_PRODUCTS_CATEGORY_SLUG) {
        product.isNewImport = false;
      }
      if (dto.collection !== undefined) {
        product.collection = dto.collection.trim() || null;
      }
      if (dto.hiddenTags !== undefined) {
        product.enrichment = {
          ...(product.enrichment ?? {}),
          hiddenTags: [
            ...new Set(dto.hiddenTags.map((tag) => tag.trim()).filter(Boolean)),
          ],
        };
      }
      if (dto.modelSelectionEnabled !== undefined) {
        product.enrichment = {
          ...(product.enrichment ?? {}),
          modelSelectionEnabled: dto.modelSelectionEnabled,
        };
      }

      return manager.save(ProductEntity, product);
    });
  }
}
