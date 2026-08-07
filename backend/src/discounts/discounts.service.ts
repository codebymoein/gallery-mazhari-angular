import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductEntity } from '../products/entities/product.entity';
import { BulkProductDiscountDto } from './dto/bulk-product-discount.dto';
import {
  CreateDiscountRuleDto,
  UpdateDiscountRuleDto,
} from './dto/discount-rule.dto';
import { DiscountRuleEntity } from './entities/discount-rule.entity';
import { resolveDiscount } from './discount-resolver';

const INVENTORY_BULK_DISCOUNT_TITLE = 'تخفیف گروهی انبار';

@Injectable()
export class DiscountsService {
  constructor(
    @InjectRepository(DiscountRuleEntity)
    private readonly rules: Repository<DiscountRuleEntity>,
    @InjectRepository(ProductEntity)
    private readonly products: Repository<ProductEntity>,
  ) {}

  listRules(): Promise<DiscountRuleEntity[]> {
    return this.rules.find({
      order: { active: 'DESC', priority: 'DESC', createdAt: 'DESC' },
    });
  }

  async create(dto: CreateDiscountRuleDto): Promise<DiscountRuleEntity> {
    this.validateDates(dto.startsAt, dto.endsAt);
    return this.rules.save(this.rules.create(this.clean(dto)));
  }

  async update(
    id: string,
    dto: UpdateDiscountRuleDto,
  ): Promise<DiscountRuleEntity> {
    this.validateDates(dto.startsAt, dto.endsAt);
    const current = await this.rules.findOne({ where: { id } });
    if (!current) throw new NotFoundException('قانون تخفیف پیدا نشد.');
    Object.assign(current, this.clean(dto));
    return this.rules.save(current);
  }

  async remove(id: string): Promise<{ deleted: true }> {
    const result = await this.rules.delete(id);
    if (!result.affected) throw new NotFoundException('قانون تخفیف پیدا نشد.');
    return { deleted: true };
  }

  async bulkProductDiscount(dto: BulkProductDiscountDto): Promise<{
    updated: number;
    percent: number;
    productIds: string[];
  }> {
    const productIds = [...new Set(dto.productIds)];
    if (!productIds.length) {
      throw new BadRequestException('حداقل یک محصول باید انتخاب شود.');
    }

    return this.rules.manager.transaction(async (manager) => {
      const productRepo = manager.getRepository(ProductEntity);
      const ruleRepo = manager.getRepository(DiscountRuleEntity);
      const query = productRepo
        .createQueryBuilder('product')
        .where('product.id IN (:...productIds)', { productIds });

      if (manager.connection.options.type === 'postgres') {
        query.setLock('pessimistic_write');
      }

      const products = await query.getMany();
      if (products.length !== productIds.length) {
        throw new NotFoundException('یک یا چند محصول انتخاب‌شده پیدا نشد.');
      }

      const rules: DiscountRuleEntity[] = [];
      for (const product of products) {
        const existing = await ruleRepo.findOne({
          where: {
            scopeType: 'product',
            targetKey: product.id,
            title: INVENTORY_BULK_DISCOUNT_TITLE,
          },
        });
        const rule =
          existing ||
          ruleRepo.create({
            title: INVENTORY_BULK_DISCOUNT_TITLE,
            scopeType: 'product',
            targetKey: product.id,
            targetLabel: `${product.code} — ${product.name}`,
            percent: dto.percent,
          });

        Object.assign(rule, {
          targetLabel: `${product.code} — ${product.name}`,
          percent: dto.percent,
          badgeText: `${dto.percent}٪ تخفیف`,
          priority: 100,
          active: true,
          showOnHome: true,
          startsAt: null,
          endsAt: null,
        });
        rules.push(rule);
      }

      await ruleRepo.save(rules);
      return {
        updated: products.length,
        percent: dto.percent,
        productIds: products.map((product) => product.id),
      };
    });
  }

  async activeRules(homeOnly = false): Promise<DiscountRuleEntity[]> {
    const all = await this.rules.find({
      where: { active: true },
      order: { priority: 'DESC' },
    });
    const now = Date.now();
    return all.filter(
      (rule) =>
        (!homeOnly || rule.showOnHome) &&
        (!rule.startsAt || new Date(rule.startsAt).getTime() <= now) &&
        (!rule.endsAt || new Date(rule.endsAt).getTime() >= now),
    );
  }

  async applyToProducts<T extends ProductEntity>(
    products: T[],
    homeOnly = false,
  ): Promise<
    Array<
      T & {
        originalPrice?: number | null;
        salePrice?: number | null;
        discountPercent?: number | null;
        discountTitle?: string | null;
        discountBadge?: string | null;
        discountRuleId?: string | null;
        discountEndsAt?: string | null;
      }
    >
  > {
    const rules = await this.activeRules(homeOnly);
    const output: Array<
      T & {
        originalPrice?: number | null;
        salePrice?: number | null;
        discountPercent?: number | null;
        discountTitle?: string | null;
        discountBadge?: string | null;
        discountRuleId?: string | null;
        discountEndsAt?: string | null;
      }
    > = [];
    for (const product of products) {
      const rule = resolveDiscount(product, rules);
      const originalPrice = Number(product.price ?? 0);
      if (!rule || originalPrice <= 0) {
        if (!homeOnly) output.push(product);
        continue;
      }
      const salePrice = Math.round(
        (originalPrice * (100 - rule.percent)) / 100,
      );
      output.push(
        Object.assign({}, product, {
          price: salePrice,
          originalPrice,
          salePrice,
          discountPercent: rule.percent,
          discountTitle: rule.title,
          discountBadge: rule.badgeText || `${rule.percent}٪ تخفیف`,
          discountRuleId: rule.id,
          discountEndsAt: rule.endsAt,
        }),
      );
    }
    return output;
  }

  async discountedProducts(homeOnly = false) {
    const products = await this.products
      .createQueryBuilder('p')
      .where('p.status = :status', { status: 'published' })
      .andWhere('p.stock > 0')
      .orderBy('p.publishedAt', 'DESC')
      .getMany();
    return this.applyToProducts(products, homeOnly);
  }

  private clean(dto: CreateDiscountRuleDto) {
    return {
      ...dto,
      title: dto.title.trim(),
      subtitle: dto.subtitle?.trim() || null,
      targetKey: dto.targetKey.trim(),
      targetLabel: dto.targetLabel.trim(),
      badgeText: dto.badgeText?.trim() || null,
      priority: dto.priority ?? 0,
      active: dto.active ?? true,
      showOnHome: dto.showOnHome ?? true,
      startsAt: dto.startsAt || null,
      endsAt: dto.endsAt || null,
    };
  }

  private validateDates(
    startsAt?: string | null,
    endsAt?: string | null,
  ): void {
    if (startsAt && Number.isNaN(Date.parse(startsAt)))
      throw new BadRequestException('تاریخ شروع نامعتبر است.');
    if (endsAt && Number.isNaN(Date.parse(endsAt)))
      throw new BadRequestException('تاریخ پایان نامعتبر است.');
    if (startsAt && endsAt && new Date(startsAt) >= new Date(endsAt)) {
      throw new BadRequestException('تاریخ پایان باید بعد از تاریخ شروع باشد.');
    }
  }
}
