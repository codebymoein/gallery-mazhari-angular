import {
  normalizeColorValue,
  normalizeSizeValue,
  detectVariationGroups,
} from './variation-detector';

describe('variation-detector', () => {
  it('normalizes size variants', () => {
    expect(normalizeSizeValue('۳۸')).toBe('38');
    expect(normalizeSizeValue('38')).toBe('38');
    expect(normalizeSizeValue('Size 38')).toBe('38');
    expect(normalizeSizeValue('سایز ۳۸')).toBe('38');
  });

  it('normalizes gold color aliases', () => {
    expect(normalizeColorValue('طلایی').canonical).toBe('Gold');
    expect(normalizeColorValue('Gold').canonical).toBe('Gold');
    expect(normalizeColorValue('gold').canonical).toBe('Gold');
  });

  it('detects size variations under parent', () => {
    const groups = detectVariationGroups([
      {
        code: 'A',
        parentCode: '13700189',
        barcode: 'BA',
        name: 'Shoe',
        size: '36',
        stock: 2,
        rowIndex: 2,
      },
      {
        code: 'B',
        parentCode: '13700189',
        barcode: 'BB',
        name: 'Shoe',
        size: '37',
        stock: 4,
        rowIndex: 3,
      },
      {
        code: 'C',
        parentCode: '13700189',
        barcode: 'BC',
        name: 'Shoe',
        size: '38',
        stock: 1,
        rowIndex: 4,
      },
    ]);
    const g = groups.find((x) => x.parentCode === '13700189')!;
    expect(g.kind).toBe('size_variations');
    expect(g.requiresReview).toBe(false);
  });

  it('detects color variations', () => {
    const groups = detectVariationGroups([
      {
        code: '1',
        parentCode: 'T1',
        barcode: 'X1',
        name: 'Tiara',
        color: 'Silver',
        stock: 1,
        rowIndex: 2,
      },
      {
        code: '2',
        parentCode: 'T1',
        barcode: 'X2',
        name: 'Tiara',
        color: 'Gold',
        stock: 1,
        rowIndex: 3,
      },
      {
        code: '3',
        parentCode: 'T1',
        barcode: 'X3',
        name: 'Tiara',
        color: 'Rose Gold',
        stock: 1,
        rowIndex: 4,
      },
    ]);
    expect(groups[0].kind).toBe('color_variations');
  });

  it('sends single child to review', () => {
    const groups = detectVariationGroups([
      {
        code: '1',
        parentCode: 'P',
        barcode: 'B1',
        name: 'X',
        size: '38',
        stock: 1,
        rowIndex: 2,
      },
    ]);
    expect(groups[0].requiresReview).toBe(true);
    expect(groups[0].kind).toBe('uncertain');
  });

  it('flags duplicate child barcodes', () => {
    const groups = detectVariationGroups([
      {
        code: '1',
        parentCode: 'P',
        barcode: 'SAME',
        name: 'X',
        size: '38',
        stock: 1,
        rowIndex: 2,
      },
      {
        code: '2',
        parentCode: 'P',
        barcode: 'SAME',
        name: 'X',
        size: '39',
        stock: 1,
        rowIndex: 3,
      },
    ]);
    expect(groups[0].kind).toBe('uncertain');
    expect(groups[0].evidence.join(' ')).toContain('duplicate_child_barcodes');
  });

  it('accepts distinct barcodes as variations when no named axis exists', () => {
    const groups = detectVariationGroups([
      {
        code: 'B1',
        parentCode: 'P',
        barcode: 'B1',
        name: 'Model',
        stock: 1,
        rowIndex: 2,
      },
      {
        code: 'B2',
        parentCode: 'P',
        barcode: 'B2',
        name: 'Model',
        stock: 1,
        rowIndex: 3,
      },
    ]);
    expect(groups[0].kind).toBe('other_variations');
    expect(groups[0].requiresReview).toBe(false);
  });
});
