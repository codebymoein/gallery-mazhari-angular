import { DiscountRuleEntity } from './entities/discount-rule.entity';

export interface DiscountableProduct {
  id: string;
  code: string;
  parentCategorySlug: string;
  categorySlug: string;
  price?: number | null;
}

export function isRuleActive(
  rule: DiscountRuleEntity,
  now = new Date(),
): boolean {
  if (!rule.active) return false;
  const time = now.getTime();
  if (rule.startsAt && new Date(rule.startsAt).getTime() > time) return false;
  if (rule.endsAt && new Date(rule.endsAt).getTime() < time) return false;
  return true;
}

export function resolveDiscount(
  product: DiscountableProduct,
  rules: DiscountRuleEntity[],
  now = new Date(),
): DiscountRuleEntity | undefined {
  return rules
    .filter((rule) => {
      if (!isRuleActive(rule, now)) return false;
      if (rule.scopeType === 'product') {
        return (
          rule.targetKey === product.id ||
          rule.targetKey.toUpperCase() === product.code.toUpperCase()
        );
      }
      if (rule.scopeType === 'subcategory')
        return rule.targetKey === product.categorySlug;
      return rule.targetKey === product.parentCategorySlug;
    })
    .sort((a, b) => b.percent - a.percent || b.priority - a.priority)[0];
}
