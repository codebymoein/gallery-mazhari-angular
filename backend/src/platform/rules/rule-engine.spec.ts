import {
  detectRuleConflicts,
  rankRecommendations,
  scoreCandidate,
  MerchRule,
  ProductContext,
} from './rule-engine';
import {
  generateTagSuggestions,
  resolveCanonicalTag,
} from '../taxonomy/tagging-engine';

const dress: ProductContext = {
  id: '1',
  code: 'D1',
  category: 'لباس عروس اروپایی',
  style: 'European',
  colorFamily: 'Ivory',
  ceremonyType: 'Garden Wedding',
  price: 10000000,
  stock: 2,
  status: 'published',
};

const shoe: ProductContext = {
  id: '2',
  code: 'S1',
  category: 'کفش عروس',
  style: 'European',
  colorFamily: 'Ivory',
  price: 2000000,
  stock: 3,
  status: 'published',
};

const oos: ProductContext = {
  id: '3',
  code: 'S2',
  category: 'کفش عروس',
  style: 'European',
  colorFamily: 'Ivory',
  price: 2000000,
  stock: 0,
  status: 'published',
};

const draft: ProductContext = {
  id: '4',
  code: 'S3',
  category: 'کفش عروس',
  style: 'European',
  colorFamily: 'Ivory',
  price: 2000000,
  stock: 5,
  status: 'draft',
};

describe('rule-engine + tagging', () => {
  it('excludes out of stock and unpublished', () => {
    expect(scoreCandidate(dress, oos)?.exclusionReason).toBe('inventory');
    expect(scoreCandidate(dress, draft)?.exclusionReason).toBe(
      'publication_status',
    );
  });

  it('ranks complementary in-stock products', () => {
    const result = rankRecommendations(dress, [shoe, oos, draft], []);
    expect(result.recommendations.every((r) => r.product.stock > 0)).toBe(true);
    expect(
      result.recommendations.every((r) => r.product.status === 'published'),
    ).toBe(true);
    expect(result.recommendations[0].product.code).toBe('S1');
    expect(result.recommendations[0].components).toBeDefined();
  });

  it('applies recommend_category rule and explains matches', () => {
    const rules: MerchRule[] = [
      {
        id: 'r1',
        name: 'Bridal to shoes',
        enabled: true,
        priority: 10,
        weight: 2,
        conditions: [
          { field: 'category', op: 'contains', value: 'لباس عروس' },
          { field: 'style', op: 'eq', value: 'European' },
        ],
        actions: [
          { type: 'recommend_category', value: 'کفش' },
          { type: 'boost', value: 'S1', weight: 3 },
        ],
      },
    ];
    const result = rankRecommendations(dress, [shoe], rules);
    expect(result.matchedRules).toHaveLength(1);
    expect(result.recommendations[0].appliedRules).toContain('r1');
  });

  it('detects contradictory same-priority rules', () => {
    const warnings = detectRuleConflicts([
      {
        id: 'a',
        name: 'a',
        enabled: true,
        priority: 1,
        weight: 1,
        conditions: [],
        actions: [{ type: 'include', value: 'X' }],
      },
      {
        id: 'b',
        name: 'b',
        enabled: true,
        priority: 1,
        weight: 1,
        conditions: [],
        actions: [{ type: 'exclude', value: 'X' }],
      },
    ]);
    expect(warnings.some((w) => w.includes('contradictory'))).toBe(true);
  });

  it('never auto-applies low confidence tags', () => {
    const tags = generateTagSuggestions({
      name: 'محصول ساده',
      category: 'متفرقه',
    });
    // no keyword hits → empty or only high evidence
    expect(
      tags.every((t) => t.confidence >= 0.6 || t.approvalState === 'suggested'),
    ).toBe(true);
  });

  it('collapses european synonyms', () => {
    expect(resolveCanonicalTag('European Style', {})).toBe('European Style');
    expect(resolveCanonicalTag('Style European', {})).toBe('European Style');
    expect(resolveCanonicalTag('European', {})).toBe('European Style');
  });

  it('emits evidence and confidence for european dress', () => {
    const tags = generateTagSuggestions({
      name: 'لباس عروس اروپایی',
      category: 'european-bridal-dresses',
    });
    const euro = tags.find((t) => t.tagValue === 'European Style');
    expect(euro).toBeDefined();
    expect(euro!.confidence).toBeGreaterThanOrEqual(0.85);
    expect(euro!.evidence.length).toBeGreaterThan(0);
    expect(euro!.approvalState).toBe('auto_approved');
  });
});
