import {
  normalizeDigits,
  normalizeProductCode,
  normalizeText,
} from '../common/text-normalize';

export type VariationAxis = 'size' | 'color' | 'material' | 'other';

export interface RawVariationRow {
  code: string;
  parentCode?: string | null;
  barcode?: string | null;
  name: string;
  size?: string | null;
  color?: string | null;
  material?: string | null;
  stock?: number | null;
  price?: number | null;
  category?: string | null;
  rowIndex: number;
}

export type GroupingKind =
  | 'simple'
  | 'size_variations'
  | 'color_variations'
  | 'size_color_variations'
  | 'other_variations'
  | 'uncertain';

export interface DetectedGroup {
  parentCode: string;
  kind: GroupingKind;
  confidence: number;
  evidence: string[];
  children: RawVariationRow[];
  requiresReview: boolean;
}

const SIZE_PATTERNS: RegExp[] = [
  /(?:size|سایز|سايز)\s*[:\-]?\s*(\d{2,3})/i,
  /^(\d{2})$/,
  /^(\d{2})\s*$/,
];

const COLOR_CANON: Array<{ canonical: string; aliases: string[] }> = [
  {
    canonical: 'Gold',
    aliases: ['gold', 'طلایی', 'طلائي', 'طلایی رنگ', 'زرد طلایی'],
  },
  {
    canonical: 'Silver',
    aliases: ['silver', 'نقره‌ای', 'نقره ای', 'نقره', 'سیلور'],
  },
  {
    canonical: 'Rose Gold',
    aliases: ['rose gold', 'رزگلد', 'رز گلد', 'طلایی صورتی', 'روز گلد'],
  },
  { canonical: 'Ivory', aliases: ['ivory', 'آیوری', 'عاجی', 'شیری'] },
  { canonical: 'White', aliases: ['white', 'سفید', 'سفید رنگ'] },
  { canonical: 'Champagne', aliases: ['champagne', 'شامپاین', 'champagne'] },
  { canonical: 'Black', aliases: ['black', 'مشکی', 'سیاه'] },
];

export function normalizeSizeValue(
  raw: string | null | undefined,
): string | null {
  if (raw == null || !String(raw).trim()) return null;
  const n = normalizeDigits(String(raw).trim());
  for (const re of SIZE_PATTERNS) {
    const m = n.match(re);
    if (m?.[1]) return m[1];
  }
  const digits = n.match(/(\d{2,3})/);
  return digits ? digits[1] : normalizeText(n) || null;
}

export function normalizeColorValue(raw: string | null | undefined): {
  canonical: string | null;
  confidence: number;
  ambiguous: boolean;
} {
  if (raw == null || !String(raw).trim()) {
    return { canonical: null, confidence: 0, ambiguous: false };
  }
  const key = normalizeText(raw);
  const hits = COLOR_CANON.filter((c) =>
    c.aliases.some(
      (a) => normalizeText(a) === key || key.includes(normalizeText(a)),
    ),
  );
  if (hits.length === 1) {
    return { canonical: hits[0].canonical, confidence: 0.95, ambiguous: false };
  }
  if (hits.length > 1) {
    return { canonical: null, confidence: 0.4, ambiguous: true };
  }
  return { canonical: null, confidence: 0.5, ambiguous: true };
}

function axesPresent(rows: RawVariationRow[]): {
  sizes: Set<string>;
  colors: Set<string>;
} {
  const sizes = new Set<string>();
  const colors = new Set<string>();
  for (const r of rows) {
    const s = normalizeSizeValue(r.size ?? undefined);
    if (s) sizes.add(s);
    const c = normalizeColorValue(r.color ?? undefined);
    if (c.canonical) colors.add(c.canonical);
    else if (r.color && normalizeText(r.color))
      colors.add(normalizeText(r.color));
  }
  return { sizes, colors };
}

/**
 * Detect parent/variable product groups.
 * Insufficient evidence → uncertain + requiresReview (never force variable).
 */
export function detectVariationGroups(
  rows: RawVariationRow[],
): DetectedGroup[] {
  const byParent = new Map<string, RawVariationRow[]>();
  const simples: RawVariationRow[] = [];

  for (const row of rows) {
    const parent = normalizeProductCode(row.parentCode || '');
    const code = normalizeProductCode(row.code);
    if (parent && parent !== code) {
      const list = byParent.get(parent) ?? [];
      list.push(row);
      byParent.set(parent, list);
    } else {
      simples.push(row);
    }
  }

  const groups: DetectedGroup[] = [];

  for (const [parentCode, children] of byParent) {
    const { sizes, colors } = axesPresent(children);
    const evidence: string[] = [
      `parent_code=${parentCode}`,
      `child_count=${children.length}`,
      `distinct_sizes=${sizes.size}`,
      `distinct_colors=${colors.size}`,
    ];

    const barcodes = children
      .map((c) => normalizeProductCode(c.barcode || ''))
      .filter(Boolean);
    const uniqueBarcodes = new Set(barcodes);
    if (barcodes.length !== uniqueBarcodes.size) {
      groups.push({
        parentCode,
        kind: 'uncertain',
        confidence: 0.2,
        evidence: [...evidence, 'duplicate_child_barcodes'],
        children,
        requiresReview: true,
      });
      continue;
    }

    if (children.length === 1) {
      groups.push({
        parentCode,
        kind: 'uncertain',
        confidence: 0.45,
        evidence: [...evidence, 'single_child_insufficient'],
        children,
        requiresReview: true,
      });
      continue;
    }

    let kind: GroupingKind = 'uncertain';
    let confidence = 0.5;

    if (sizes.size > 1 && colors.size > 1) {
      kind = 'size_color_variations';
      confidence = 0.9;
      evidence.push('multi_size_and_color');
    } else if (sizes.size > 1 && colors.size <= 1) {
      kind = 'size_variations';
      confidence = 0.92;
      evidence.push('multi_size');
    } else if (colors.size > 1 && sizes.size <= 1) {
      kind = 'color_variations';
      confidence = 0.9;
      evidence.push('multi_color');
    } else if (
      uniqueBarcodes.size === children.length &&
      children.length >= 2
    ) {
      kind = 'other_variations';
      confidence = 0.85;
      evidence.push('distinct_barcodes_define_variations');
    }

    groups.push({
      parentCode,
      kind,
      confidence,
      evidence,
      children,
      requiresReview: confidence < 0.75 || kind === 'uncertain',
    });
  }

  for (const row of simples) {
    const code = normalizeProductCode(row.code);
    groups.push({
      parentCode: code,
      kind: 'simple',
      confidence: 1,
      evidence: ['no_parent_code'],
      children: [row],
      requiresReview: false,
    });
  }

  return groups;
}
