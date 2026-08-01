import {
  inventoryUrgencyLabel,
  jaccardSimilarity,
  PSYCHOLOGY_WIDGETS,
} from './similarity';
import { matchProductsToCollections } from './collection-engine';

describe('similarity + collections', () => {
  it('computes jaccard on hidden tags', () => {
    expect(
      jaccardSimilarity(
        ['European Style', 'Ivory', 'Garden'],
        ['European Style', 'Garden', 'Shoes'],
      ),
    ).toBeCloseTo(0.5, 5);
    expect(jaccardSimilarity([], [])).toBe(0);
  });

  it('only shows urgency for real low stock', () => {
    expect(inventoryUrgencyLabel(0)).toBeNull();
    expect(inventoryUrgencyLabel(5, 2)).toBeNull();
    expect(inventoryUrgencyLabel(1, 2)).toContain('1');
  });

  it('exposes psychology widgets without scarcity fakery keys', () => {
    expect(PSYCHOLOGY_WIDGETS.complete_your_bridal_look.labelFa).toBeTruthy();
    expect(PSYCHOLOGY_WIDGETS.luxury_combination.emphasizeLuxury).toBe(true);
  });

  it('matches garden collection from tags', () => {
    const matched = matchProductsToCollections(
      [
        { code: 'A', tags: ['Garden', 'Romantic'] },
        { code: 'B', tags: ['Outdoor Wedding'] },
        { code: 'C', tags: ['Garden Compatible'] },
        { code: 'D', tags: ['Minimal'] },
      ],
      undefined,
      { minProducts: 3 },
    );
    const garden = matched.find((m) => m.slug === 'garden-wedding');
    expect(garden).toBeDefined();
    expect(garden!.productCodes).toEqual(
      expect.arrayContaining(['A', 'B', 'C']),
    );
    expect(garden!.productCodes).not.toContain('D');
  });
});
