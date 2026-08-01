/**
 * Hybrid smart tagging — confidence + evidence required.
 * Hidden tags only — never intended for public storefront chips.
 * Low confidence → suggest only; never silent apply.
 */

import { normalizeText } from '../common/text-normalize';

export type TagApprovalState =
  'auto_approved' | 'pending_review' | 'suggested' | 'rejected' | 'approved';

export interface TagSuggestion {
  tagValue: string;
  confidence: number;
  evidence: string[];
  ruleOrModel: string;
  timestamp: string;
  approvalState: TagApprovalState;
}

export interface TaggingThresholds {
  high: number; // auto-approve internal
  medium: number; // pending review
  // below medium → suggested only
}

export const DEFAULT_TAG_THRESHOLDS: TaggingThresholds = {
  high: 0.85,
  medium: 0.6,
};

export interface TaggingInput {
  name: string;
  category: string;
  description?: string;
  size?: string | null;
  color?: string | null;
  material?: string | null;
  price?: number | null;
  excelFields?: Record<string, string>;
  approvedAliases?: Record<string, string>; // raw → canonical
}

type TagRule = {
  id: string;
  tag: string;
  test: (
    input: TaggingInput,
    hay: string,
  ) => { hit: boolean; evidence: string[] };
  baseConfidence: number;
};

const RULES: TagRule[] = [
  // —— Style / region ——
  {
    id: 'keyword.european',
    tag: 'European Style',
    baseConfidence: 0.91,
    test: (input, hay) => {
      const evidence: string[] = [];
      if (/اروپایی|european/.test(hay)) evidence.push('title/category keyword');
      if (/european/i.test(input.category)) evidence.push('category');
      return { hit: evidence.length > 0, evidence };
    },
  },
  {
    id: 'keyword.arabic',
    tag: 'Arabic Style',
    baseConfidence: 0.9,
    test: (_i, hay) => {
      const evidence: string[] = [];
      if (/عربی|arabic/.test(hay)) evidence.push('title/category keyword');
      return { hit: evidence.length > 0, evidence };
    },
  },
  {
    id: 'keyword.classic',
    tag: 'Classic',
    baseConfidence: 0.78,
    test: (_i, hay) => ({
      hit: /کلاسیک|classic/.test(hay),
      evidence: /کلاسیک|classic/.test(hay) ? ['keyword'] : [],
    }),
  },
  {
    id: 'keyword.modern',
    tag: 'Modern',
    baseConfidence: 0.78,
    test: (_i, hay) => ({
      hit: /مدرن|modern/.test(hay),
      evidence: /مدرن|modern/.test(hay) ? ['keyword'] : [],
    }),
  },
  {
    id: 'keyword.vintage',
    tag: 'Vintage',
    baseConfidence: 0.8,
    test: (_i, hay) => ({
      hit: /وینتیج|vintage|retro/.test(hay),
      evidence: /وینتیج|vintage|retro/.test(hay) ? ['keyword'] : [],
    }),
  },
  {
    id: 'keyword.minimal',
    tag: 'Minimal',
    baseConfidence: 0.82,
    test: (_i, hay) => ({
      hit: /مینیمال|minimal|ساده\s*شیک/.test(hay),
      evidence: /مینیمال|minimal|ساده\s*شیک/.test(hay) ? ['keyword'] : [],
    }),
  },
  {
    id: 'keyword.princess',
    tag: 'Princess',
    baseConfidence: 0.84,
    test: (_i, hay) => ({
      hit: /پرنسس|princess|شاهانه|royal/.test(hay),
      evidence: /پرنسس|princess|شاهانه|royal/.test(hay) ? ['keyword'] : [],
    }),
  },
  {
    id: 'keyword.romantic',
    tag: 'Romantic',
    baseConfidence: 0.72,
    test: (_i, hay) => {
      const evidence: string[] = [];
      if (/رمانتیک|romantic|تور گل/.test(hay)) evidence.push('keyword');
      return { hit: evidence.length > 0, evidence };
    },
  },
  {
    id: 'keyword.formal',
    tag: 'Formal',
    baseConfidence: 0.75,
    test: (_i, hay) => ({
      hit: /رسمی|formal|ceremony/.test(hay),
      evidence: /رسمی|formal|ceremony/.test(hay) ? ['keyword'] : [],
    }),
  },
  {
    id: 'keyword.luxury',
    tag: 'Luxury',
    baseConfidence: 0.8,
    test: (input, hay) => {
      const evidence: string[] = [];
      if (/لوکس|luxury|برند/.test(hay)) evidence.push('keyword');
      if (input.price != null && input.price >= 80_000_000) {
        evidence.push('price_tier_inferred');
      }
      return { hit: evidence.length > 0, evidence };
    },
  },
  // —— Ceremony / place ——
  {
    id: 'keyword.garden',
    tag: 'Garden',
    baseConfidence: 0.7,
    test: (_i, hay) => {
      const evidence: string[] = [];
      if (/باغ|garden/.test(hay)) evidence.push('keyword');
      return { hit: evidence.length > 0, evidence };
    },
  },
  {
    id: 'keyword.outdoor',
    tag: 'Outdoor Wedding',
    baseConfidence: 0.72,
    test: (_i, hay) => ({
      hit: /فضای باز|outdoor|garden/.test(hay),
      evidence: /فضای باز|outdoor|garden/.test(hay) ? ['keyword'] : [],
    }),
  },
  {
    id: 'keyword.indoor',
    tag: 'Indoor Wedding',
    baseConfidence: 0.7,
    test: (_i, hay) => ({
      hit: /سالن|indoor|تالار/.test(hay),
      evidence: /سالن|indoor|تالار/.test(hay) ? ['keyword'] : [],
    }),
  },
  // —— Product family ——
  {
    id: 'cat.bridal_dress',
    tag: 'Bridal Dress',
    baseConfidence: 0.93,
    test: (input, hay) => ({
      hit:
        /لباس\s*عروس|bridal\s*dress|wedding\s*dress/.test(hay) ||
        /لباس عروس/.test(input.category),
      evidence: ['category/title'],
    }),
  },
  {
    id: 'cat.bridal_accessories',
    tag: 'Bridal Accessories',
    baseConfidence: 0.88,
    test: (_i, hay) => ({
      hit: /اکسسوری|accessories|زیور|تاج|تور|دستکش/.test(hay),
      evidence: /اکسسوری|accessories|زیور|تاج|تور|دستکش/.test(hay)
        ? ['category/title']
        : [],
    }),
  },
  {
    id: 'cat.hair',
    tag: 'Hair Accessories',
    baseConfidence: 0.9,
    test: (_i, hay) => ({
      hit: /مو|hair|تاج|شانه\s*مو|tiara|comb/.test(hay),
      evidence: /مو|hair|تاج|شانه\s*مو|tiara|comb/.test(hay) ? ['keyword'] : [],
    }),
  },
  {
    id: 'cat.shoes',
    tag: 'Wedding Shoes',
    baseConfidence: 0.92,
    test: (_i, hay) => ({
      hit: /کفش|shoes?|heel/.test(hay),
      evidence: /کفش|shoes?|heel/.test(hay) ? ['keyword'] : [],
    }),
  },
  // —— Compatibility (for relationship engine) ——
  {
    id: 'compat.veil',
    tag: 'Veil Compatible',
    baseConfidence: 0.7,
    test: (input, hay) => ({
      hit:
        /لباس\s*عروس|bridal/.test(hay) ||
        /تور|veil/.test(hay) ||
        /لباس عروس/.test(input.category),
      evidence: ['bridal_family'],
    }),
  },
  {
    id: 'compat.tiara',
    tag: 'Tiara Compatible',
    baseConfidence: 0.68,
    test: (_i, hay) => ({
      hit: /لباس\s*عروس|تاج|tiara|پرنسس|princess/.test(hay),
      evidence: ['bridal_or_tiara_context'],
    }),
  },
  {
    id: 'compat.necklace',
    tag: 'Necklace Compatible',
    baseConfidence: 0.65,
    test: (_i, hay) => ({
      hit: /لباس\s*عروس|گردنبند|necklace|یقه\s*باز|decollete/.test(hay),
      evidence: ['accessory_compat'],
    }),
  },
  {
    id: 'compat.glove',
    tag: 'Glove Compatible',
    baseConfidence: 0.66,
    test: (_i, hay) => ({
      hit: /لباس\s*عروس|دستکش|gloves?|آستین\s*کوتاه/.test(hay),
      evidence: ['accessory_compat'],
    }),
  },
  {
    id: 'compat.bouquet',
    tag: 'Bouquet Compatible',
    baseConfidence: 0.64,
    test: (_i, hay) => ({
      hit: /لباس\s*عروس|دسته\s*گل|bouquet|garden|رمانتیک/.test(hay),
      evidence: ['accessory_compat'],
    }),
  },
  {
    id: 'compat.ceremony',
    tag: 'Ceremony Compatible',
    baseConfidence: 0.7,
    test: (_i, hay) => ({
      hit: /مراسم|ceremony|عروس|bridal|wedding/.test(hay),
      evidence: ['ceremony_context'],
    }),
  },
  // —— Color / material ——
  {
    id: 'color.white',
    tag: 'White',
    baseConfidence: 0.9,
    test: (input, hay) => ({
      hit: /سفید|white/.test(hay) || /white|سفید/i.test(input.color || ''),
      evidence: ['color'],
    }),
  },
  {
    id: 'color.ivory',
    tag: 'Ivory',
    baseConfidence: 0.9,
    test: (input, hay) => ({
      hit:
        /آیوری|ivory|عاجی|شیری/.test(hay) ||
        /ivory|آیوری/i.test(input.color || ''),
      evidence: ['color'],
    }),
  },
  {
    id: 'color.champagne',
    tag: 'Champagne',
    baseConfidence: 0.9,
    test: (input, hay) => ({
      hit:
        /شامپاین|champagne/.test(hay) ||
        /champagne|شامپاین/i.test(input.color || ''),
      evidence: ['color'],
    }),
  },
  {
    id: 'material.detected',
    tag: 'Material Tagged',
    baseConfidence: 0.8,
    test: (input) => {
      if (!input.material) return { hit: false, evidence: [] };
      return {
        hit: true,
        evidence: [`excel material=${input.material}`],
      };
    },
  },
  {
    id: 'color.family',
    tag: 'Color Family',
    baseConfidence: 0.88,
    test: (input) => {
      if (!input.color) return { hit: false, evidence: [] };
      return {
        hit: true,
        evidence: [`variation color=${input.color}`],
      };
    },
  },
  // —— Price tiers ——
  {
    id: 'tier.budget',
    tag: 'Budget Level',
    baseConfidence: 0.75,
    test: (input) => ({
      hit: input.price != null && input.price > 0 && input.price < 25_000_000,
      evidence: input.price != null ? [`price=${input.price}`] : [],
    }),
  },
  {
    id: 'tier.mid',
    tag: 'Price Tier Mid',
    baseConfidence: 0.75,
    test: (input) => ({
      hit:
        input.price != null &&
        input.price >= 25_000_000 &&
        input.price < 80_000_000,
      evidence: input.price != null ? [`price=${input.price}`] : [],
    }),
  },
  {
    id: 'tier.luxury_level',
    tag: 'Luxury Level',
    baseConfidence: 0.78,
    test: (input) => ({
      hit: input.price != null && input.price >= 80_000_000,
      evidence: input.price != null ? [`price=${input.price}`] : [],
    }),
  },
];

function approvalFor(
  confidence: number,
  thresholds: TaggingThresholds,
): TagApprovalState {
  if (confidence >= thresholds.high) return 'auto_approved';
  if (confidence >= thresholds.medium) return 'pending_review';
  return 'suggested';
}

export function generateTagSuggestions(
  input: TaggingInput,
  thresholds: TaggingThresholds = DEFAULT_TAG_THRESHOLDS,
  now = new Date(),
): TagSuggestion[] {
  const hay = normalizeText(
    [
      input.name,
      input.category,
      input.description || '',
      JSON.stringify(input.excelFields || {}),
    ].join(' '),
  );

  const out: TagSuggestion[] = [];

  for (const rule of RULES) {
    const { hit, evidence } = rule.test(input, hay);
    if (!hit) continue;

    let tagValue = rule.tag;
    if (rule.id === 'material.detected' && input.material) {
      tagValue = `Fabric:${input.material}`;
    }
    if (rule.id === 'color.family' && input.color) {
      tagValue = `Color:${input.color}`;
    }

    // Alias governance
    if (input.approvedAliases) {
      const key = normalizeText(tagValue);
      for (const [raw, canonical] of Object.entries(input.approvedAliases)) {
        if (normalizeText(raw) === key) {
          tagValue = canonical;
          evidence.push(`alias_map:${raw}→${canonical}`);
        }
      }
    }

    let confidence = Math.min(0.99, rule.baseConfidence);
    if (evidence.includes('price_tier_inferred') && evidence.length === 1) {
      confidence = Math.min(confidence, 0.7);
    }

    out.push({
      tagValue,
      confidence,
      evidence,
      ruleOrModel: rule.id,
      timestamp: now.toISOString(),
      approvalState: approvalFor(confidence, thresholds),
    });
  }

  return out;
}

/** Taxonomy merge: prevent synonym sprawl */
export function resolveCanonicalTag(
  raw: string,
  aliases: Record<string, string>,
): string {
  const key = normalizeText(raw);
  for (const [alias, canonical] of Object.entries(aliases)) {
    if (normalizeText(alias) === key) return canonical;
  }
  if (
    /european\s*style|style\s*european|european/.test(key) ||
    key === 'اروپایی'
  ) {
    return aliases[key] || 'European Style';
  }
  if (/arabic\s*style|عربی/.test(key)) {
    return aliases[key] || 'Arabic Style';
  }
  return raw.trim();
}
