import { resolveDiscount } from './discount-resolver';
import { DiscountRuleEntity } from './entities/discount-rule.entity';

const rule = (patch: Partial<DiscountRuleEntity>): DiscountRuleEntity =>
  Object.assign(new DiscountRuleEntity(), {
    id: 'rule',
    title: 'test',
    subtitle: null,
    scopeType: 'category',
    targetKey: 'bridal',
    targetLabel: 'bridal',
    percent: 10,
    badgeText: null,
    priority: 0,
    active: true,
    showOnHome: true,
    startsAt: null,
    endsAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...patch,
  });

const product = {
  id: 'p1',
  code: '10010029',
  parentCategorySlug: 'bridal',
  categorySlug: 'dress',
  price: 1_000_000,
};

describe('discount resolver', () => {
  it('chooses the greatest matching discount across all scopes', () => {
    const result = resolveDiscount(product, [
      rule({ percent: 10 }),
      rule({
        id: 'sub',
        scopeType: 'subcategory',
        targetKey: 'dress',
        percent: 20,
      }),
      rule({
        id: 'product',
        scopeType: 'product',
        targetKey: 'p1',
        percent: 15,
      }),
    ]);
    expect(result?.id).toBe('sub');
  });

  it('uses priority when percentages are equal', () => {
    const result = resolveDiscount(product, [
      rule({ id: 'low', percent: 20, priority: 1 }),
      rule({ id: 'high', percent: 20, priority: 5 }),
    ]);
    expect(result?.id).toBe('high');
  });

  it('ignores inactive and expired rules', () => {
    const result = resolveDiscount(
      product,
      [
        rule({ active: false, percent: 50 }),
        rule({ endsAt: '2020-01-01T00:00:00.000Z', percent: 40 }),
        rule({ id: 'valid', percent: 12 }),
      ],
      new Date('2026-01-01T00:00:00.000Z'),
    );
    expect(result?.id).toBe('valid');
  });
});
