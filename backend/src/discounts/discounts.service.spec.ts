import { NotFoundException } from '@nestjs/common';
import { ProductEntity } from '../products/entities/product.entity';
import { DiscountRuleEntity } from './entities/discount-rule.entity';
import { DiscountsService } from './discounts.service';

const product = (id: string, code: string): ProductEntity =>
  ({ id, code, name: `Product ${code}` }) as ProductEntity;

const rule = (value: Partial<DiscountRuleEntity>): DiscountRuleEntity =>
  ({
    id: 'rule-id',
    title: 'تخفیف گروهی انبار',
    subtitle: null,
    scopeType: 'product',
    targetKey: 'product-a',
    targetLabel: 'A',
    percent: 5,
    badgeText: null,
    priority: 0,
    active: false,
    showOnHome: false,
    startsAt: null,
    endsAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...value,
  }) as DiscountRuleEntity;

describe('DiscountsService bulk inventory command', () => {
  it('locks products and reuses the deterministic inventory rule on retry', async () => {
    const products = [product('product-a', 'A'), product('product-b', 'B')];
    const existing = rule({ targetKey: 'product-a' });
    const created = rule({ id: 'rule-b', targetKey: 'product-b' });
    const query = {
      where: jest.fn().mockReturnThis(),
      setLock: jest.fn().mockReturnThis(),
      getMany: jest.fn(async () => products),
    };
    const productRepo = {
      createQueryBuilder: jest.fn(() => query),
    };
    const ruleRepo = {
      findOne: jest
        .fn()
        .mockResolvedValueOnce(existing)
        .mockResolvedValueOnce(null),
      create: jest.fn(() => created),
      save: jest.fn(async (rows: DiscountRuleEntity[]) => rows),
    };
    const manager = {
      connection: { options: { type: 'postgres' } },
      getRepository: jest.fn((entity: unknown) =>
        entity === ProductEntity ? productRepo : ruleRepo,
      ),
    };
    const rootRules = {
      manager: {
        transaction: jest.fn(
          async (callback: (value: typeof manager) => Promise<unknown>) =>
            callback(manager),
        ),
      },
    };
    const service = new DiscountsService(rootRules as never, {} as never);

    const result = await service.bulkProductDiscount({
      productIds: ['product-a', 'product-b', 'product-a'],
      percent: 10,
    });

    expect(query.setLock).toHaveBeenCalledWith('pessimistic_write');
    expect(ruleRepo.create).toHaveBeenCalledTimes(1);
    expect(ruleRepo.save).toHaveBeenCalledTimes(1);
    expect(existing).toMatchObject({ percent: 10, active: true, priority: 100 });
    expect(result).toEqual({
      updated: 2,
      percent: 10,
      productIds: ['product-a', 'product-b'],
    });
  });

  it('rejects the whole command before saving when any product is missing', async () => {
    const query = {
      where: jest.fn().mockReturnThis(),
      setLock: jest.fn().mockReturnThis(),
      getMany: jest.fn(async () => [product('product-a', 'A')]),
    };
    const productRepo = {
      createQueryBuilder: jest.fn(() => query),
    };
    const ruleRepo = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };
    const manager = {
      connection: { options: { type: 'postgres' } },
      getRepository: jest.fn((entity: unknown) =>
        entity === ProductEntity ? productRepo : ruleRepo,
      ),
    };
    const rootRules = {
      manager: {
        transaction: jest.fn(
          async (callback: (value: typeof manager) => Promise<unknown>) =>
            callback(manager),
        ),
      },
    };
    const service = new DiscountsService(rootRules as never, {} as never);

    await expect(
      service.bulkProductDiscount({
        productIds: ['product-a', 'missing-product'],
        percent: 10,
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(ruleRepo.save).not.toHaveBeenCalled();
  });
});
