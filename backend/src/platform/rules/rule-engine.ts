/**
 * Explainable merchandising rule engine + recommendation scoring.
 * Deterministic conflict order — never unpredictable.
 */

import { jaccardSimilarity } from '../merchandising/similarity';

export type RuleConditionOp =
  | 'eq'
  | 'neq'
  | 'in'
  | 'not_in'
  | 'gt'
  | 'gte'
  | 'lt'
  | 'lte'
  | 'contains'
  | 'exists';

export interface RuleCondition {
  field: string;
  op: RuleConditionOp;
  value?: unknown;
}

export type RuleActionType =
  | 'include'
  | 'exclude'
  | 'boost'
  | 'reduce'
  | 'force_curated'
  | 'recommend_category'
  | 'recommend_collection'
  | 'replace_unavailable'
  | 'limit_count'
  | 'apply_label'
  | 'set_fallback'
  | 'stop';

export interface RuleAction {
  type: RuleActionType;
  value?: unknown;
  weight?: number;
}

export interface MerchRule {
  id: string;
  name: string;
  description?: string;
  enabled: boolean;
  priority: number;
  weight: number;
  startDate?: string | null;
  endDate?: string | null;
  conditions: RuleCondition[];
  actions: RuleAction[];
  targetPages?: string[];
  targetWidgets?: string[];
  testMode?: boolean;
}

export interface ProductContext {
  id: string;
  code: string;
  category: string;
  subcategory?: string;
  style?: string;
  colorFamily?: string;
  ceremonyType?: string;
  price?: number | null;
  stock: number;
  status: string;
  tags?: string[];
  collection?: string;
  luxuryLevel?: string;
  priceTier?: string;
  parentCode?: string | null;
  size?: string | null;
  color?: string | null;
  material?: string | null;
  isNewArrival?: boolean;
  isBestseller?: boolean; // must be real-data backed by caller
  branch?: string | null;
  marginTier?: string | null;
}

export interface ScoreComponents {
  style: number;
  color: number;
  categoryComplement: number;
  ceremony: number;
  price: number;
  tagSimilarity: number;
  curatedBoost: number;
  behavioral: number;
  inventoryHealth: number;
  exclusionPenalty: number;
}

export interface ScoredRecommendation {
  product: ProductContext;
  finalScore: number;
  components: ScoreComponents;
  appliedRules: string[];
  boosts: string[];
  penalties: string[];
  exclusionReason?: string;
  source: 'curated' | 'rule' | 'compatibility' | 'fallback' | 'behavioral';
  explain: string[];
}

export const CONFLICT_ORDER = [
  'safety_legal',
  'publication_status',
  'inventory',
  'manual_exclusion',
  'curated',
  'high_priority_business',
  'compatibility',
  'behavioral',
  'fallback',
] as const;

function getField(ctx: ProductContext, field: string): unknown {
  const map: Record<string, unknown> = {
    category: ctx.category,
    subcategory: ctx.subcategory,
    productCode: ctx.code,
    parentProduct: ctx.parentCode,
    size: ctx.size,
    color: ctx.color,
    style: ctx.style,
    material: ctx.material,
    price: ctx.price,
    inventory: ctx.stock,
    stock: ctx.stock,
    status: ctx.status,
    collection: ctx.collection,
    ceremonyType: ctx.ceremonyType,
    internalTags: ctx.tags,
    marginTier: ctx.marginTier,
    newArrival: ctx.isNewArrival,
    bestseller: ctx.isBestseller,
    colorFamily: ctx.colorFamily,
    luxuryLevel: ctx.luxuryLevel,
    priceTier: ctx.priceTier,
    branch: ctx.branch,
  };
  return map[field];
}

export function evalCondition(
  ctx: ProductContext,
  cond: RuleCondition,
): boolean {
  const left = getField(ctx, cond.field);
  const right = cond.value;
  switch (cond.op) {
    case 'eq':
      return (
        String(left ?? '').toLowerCase() === String(right ?? '').toLowerCase()
      );
    case 'neq':
      return (
        String(left ?? '').toLowerCase() !== String(right ?? '').toLowerCase()
      );
    case 'in':
      return Array.isArray(right)
        ? right
            .map(String)
            .map((s) => s.toLowerCase())
            .includes(String(left ?? '').toLowerCase())
        : false;
    case 'not_in':
      return Array.isArray(right)
        ? !right
            .map(String)
            .map((s) => s.toLowerCase())
            .includes(String(left ?? '').toLowerCase())
        : true;
    case 'gt':
      return Number(left) > Number(right);
    case 'gte':
      return Number(left) >= Number(right);
    case 'lt':
      return Number(left) < Number(right);
    case 'lte':
      return Number(left) <= Number(right);
    case 'contains':
      return String(left ?? '')
        .toLowerCase()
        .includes(String(right ?? '').toLowerCase());
    case 'exists':
      return left != null && String(left) !== '';
    default:
      return false;
  }
}

export function ruleMatches(
  ctx: ProductContext,
  rule: MerchRule,
  now = new Date(),
): { matched: boolean; reason: string } {
  if (!rule.enabled && !rule.testMode) {
    return { matched: false, reason: 'disabled' };
  }
  if (rule.startDate && now < new Date(rule.startDate)) {
    return { matched: false, reason: 'before_start' };
  }
  if (rule.endDate && now > new Date(rule.endDate)) {
    return { matched: false, reason: 'after_end' };
  }
  for (const cond of rule.conditions) {
    if (!evalCondition(ctx, cond)) {
      return {
        matched: false,
        reason: `condition_failed:${cond.field}:${cond.op}`,
      };
    }
  }
  return { matched: true, reason: 'all_conditions_met' };
}

/** Detect contradictory / unreachable rules (static warnings). */
export function detectRuleConflicts(rules: MerchRule[]): string[] {
  const warnings: string[] = [];
  const enabled = rules.filter((r) => r.enabled);

  for (let i = 0; i < enabled.length; i++) {
    for (let j = i + 1; j < enabled.length; j++) {
      const a = enabled[i];
      const b = enabled[j];
      const aStop = a.actions.some((x) => x.type === 'stop');
      const bExclude = b.actions.some((x) => x.type === 'exclude');
      const aInclude = a.actions.some((x) => x.type === 'include');
      if (a.priority === b.priority && aInclude && bExclude) {
        warnings.push(`contradictory_same_priority:${a.id}|${b.id}`);
      }
      if (aStop && a.priority < b.priority) {
        // lower number = higher priority in our model
      }
      if (aStop && a.priority <= b.priority) {
        warnings.push(`unreachable_after_stop:${b.id}_after_${a.id}`);
      }
    }
  }

  // Circular curated force
  const forceIds = enabled
    .flatMap((r) =>
      r.actions
        .filter((a) => a.type === 'force_curated')
        .map((a) => String(a.value ?? '')),
    )
    .filter(Boolean);
  if (new Set(forceIds).size !== forceIds.length) {
    warnings.push('duplicate_force_curated_targets');
  }

  return [...new Set(warnings)];
}

export interface SimulatorResult {
  matchedRules: Array<{ rule: MerchRule; reason: string }>;
  unmatchedRules: Array<{ rule: MerchRule; reason: string }>;
  recommendations: ScoredRecommendation[];
  conflicts: string[];
}

const COMPLEMENTARY: Record<string, string[]> = {
  bridal_dress: [
    'tiara',
    'shoes',
    'veil',
    'jewelry',
    'gloves',
    'bags',
    'bouquet',
    'accessories',
  ],
  'لباس عروس': ['تاج', 'کفش', 'تور', 'زیورآلات', 'دستکش', 'کیف', 'دسته‌گل'],
};

function categoryComplement(source: string, candidate: string): number {
  const s = source.toLowerCase();
  const c = candidate.toLowerCase();
  for (const [key, vals] of Object.entries(COMPLEMENTARY)) {
    if (s.includes(key.toLowerCase()) || key.toLowerCase().includes(s)) {
      if (vals.some((v) => c.includes(v.toLowerCase()))) return 1;
    }
  }
  if (s && c && s !== c) return 0.2;
  return 0;
}

export function scoreCandidate(
  source: ProductContext,
  candidate: ProductContext,
  opts?: {
    curatedBoost?: number;
    behavioral?: number;
    appliedRules?: string[];
    boosts?: string[];
    sourceType?: ScoredRecommendation['source'];
  },
): ScoredRecommendation | null {
  const explain: string[] = [];
  const penalties: string[] = [];
  const boosts = [...(opts?.boosts ?? [])];

  // Safety / publication / inventory
  if (candidate.status !== 'published' && candidate.status !== 'approved') {
    return {
      product: candidate,
      finalScore: -Infinity,
      components: zeroComponents(),
      appliedRules: opts?.appliedRules ?? [],
      boosts,
      penalties: ['unpublished'],
      exclusionReason: 'publication_status',
      source: opts?.sourceType ?? 'compatibility',
      explain: ['excluded: not published'],
    };
  }

  if (candidate.stock <= 0) {
    return {
      product: candidate,
      finalScore: -Infinity,
      components: zeroComponents(),
      appliedRules: opts?.appliedRules ?? [],
      boosts,
      penalties: ['out_of_stock'],
      exclusionReason: 'inventory',
      source: opts?.sourceType ?? 'compatibility',
      explain: ['excluded: zero available inventory'],
    };
  }

  if (candidate.id === source.id || candidate.code === source.code) {
    return null;
  }

  const style =
    source.style && candidate.style && source.style === candidate.style
      ? 1
      : source.style && candidate.style
        ? 0.2
        : 0.4;
  if (style >= 1) explain.push('style_match');

  const color =
    source.colorFamily &&
    candidate.colorFamily &&
    source.colorFamily === candidate.colorFamily
      ? 1
      : 0.3;
  if (color >= 1) explain.push('color_family_match');

  const categoryComplementScore = categoryComplement(
    source.category,
    candidate.category,
  );
  if (categoryComplementScore >= 1) explain.push('complementary_category');

  const ceremony =
    source.ceremonyType &&
    candidate.ceremonyType &&
    source.ceremonyType === candidate.ceremonyType
      ? 1
      : 0.3;

  let priceScore = 0.5;
  if (source.price != null && candidate.price != null && source.price > 0) {
    const ratio = candidate.price / source.price;
    if (ratio >= 0.4 && ratio <= 1.6) priceScore = 1;
    else if (ratio >= 0.2 && ratio <= 2.5) priceScore = 0.5;
    else priceScore = 0.1;
  }

  const tagSimilarity = jaccardSimilarity(
    source.tags || [],
    candidate.tags || [],
  );
  if (tagSimilarity >= 0.35)
    explain.push(`tag_jaccard=${tagSimilarity.toFixed(2)}`);

  const curatedBoost = opts?.curatedBoost ?? 0;
  const behavioral = Math.min(0.3, opts?.behavioral ?? 0); // weak data cannot dominate
  const inventoryHealth =
    candidate.stock >= 5 ? 1 : candidate.stock >= 2 ? 0.7 : 0.4;

  const components: ScoreComponents = {
    style: style * 0.18,
    color: color * 0.14,
    categoryComplement: categoryComplementScore * 0.16,
    ceremony: ceremony * 0.08,
    price: priceScore * 0.08,
    tagSimilarity: tagSimilarity * 0.28,
    curatedBoost,
    behavioral,
    inventoryHealth: inventoryHealth * 0.08,
    exclusionPenalty: 0,
  };

  const finalScore =
    components.style +
    components.color +
    components.categoryComplement +
    components.ceremony +
    components.price +
    components.tagSimilarity +
    components.curatedBoost +
    components.behavioral +
    components.inventoryHealth -
    components.exclusionPenalty;

  return {
    product: candidate,
    finalScore,
    components,
    appliedRules: opts?.appliedRules ?? [],
    boosts,
    penalties,
    source: opts?.sourceType ?? 'compatibility',
    explain,
  };
}

function zeroComponents(): ScoreComponents {
  return {
    style: 0,
    color: 0,
    categoryComplement: 0,
    ceremony: 0,
    price: 0,
    tagSimilarity: 0,
    curatedBoost: 0,
    behavioral: 0,
    inventoryHealth: 0,
    exclusionPenalty: 0,
  };
}

/**
 * Rank recommendations with rule application + fallback.
 * Never fills with random irrelevant products.
 */
export function rankRecommendations(
  source: ProductContext,
  catalog: ProductContext[],
  rules: MerchRule[],
  opts?: { limit?: number; now?: Date },
): SimulatorResult {
  const now = opts?.now ?? new Date();
  const limit = opts?.limit ?? 8;
  const conflicts = detectRuleConflicts(rules);

  const sortedRules = [...rules].sort((a, b) => a.priority - b.priority);
  const matchedRules: SimulatorResult['matchedRules'] = [];
  const unmatchedRules: SimulatorResult['unmatchedRules'] = [];

  let stop = false;
  const boostCodes = new Map<string, number>();
  const excludeCodes = new Set<string>();
  const includeCategories = new Set<string>();
  const labels: string[] = [];
  let forcedLimit = limit;

  for (const rule of sortedRules) {
    const m = ruleMatches(source, rule, now);
    if (!m.matched) {
      unmatchedRules.push({ rule, reason: m.reason });
      continue;
    }
    matchedRules.push({ rule, reason: m.reason });
    if (stop) continue;

    for (const action of rule.actions) {
      switch (action.type) {
        case 'stop':
          stop = true;
          break;
        case 'exclude':
          if (typeof action.value === 'string') excludeCodes.add(action.value);
          if (Array.isArray(action.value))
            action.value.forEach((v) => excludeCodes.add(String(v)));
          break;
        case 'boost':
          if (typeof action.value === 'string') {
            boostCodes.set(
              action.value,
              (boostCodes.get(action.value) ?? 0) +
                (action.weight ?? rule.weight),
            );
          }
          break;
        case 'recommend_category':
          if (typeof action.value === 'string')
            includeCategories.add(action.value);
          if (Array.isArray(action.value))
            action.value.forEach((v) => includeCategories.add(String(v)));
          break;
        case 'limit_count':
          forcedLimit = Number(action.value) || forcedLimit;
          break;
        case 'apply_label':
          if (typeof action.value === 'string') labels.push(action.value);
          break;
        case 'replace_unavailable':
          // handled implicitly by inventory exclusion + rescoring
          break;
        default:
          break;
      }
    }
  }

  const scored: ScoredRecommendation[] = [];
  for (const candidate of catalog) {
    if (excludeCodes.has(candidate.code)) {
      scored.push({
        product: candidate,
        finalScore: -Infinity,
        components: zeroComponents(),
        appliedRules: matchedRules.map((m) => m.rule.id),
        boosts: [],
        penalties: ['manual_exclusion'],
        exclusionReason: 'manual_exclusion',
        source: 'rule',
        explain: ['excluded by rule'],
      });
      continue;
    }

    if (
      includeCategories.size &&
      ![...includeCategories].some((c) =>
        candidate.category.toLowerCase().includes(c.toLowerCase()),
      )
    ) {
      // soft filter — still allow complementary scoring but with penalty
    }

    const result = scoreCandidate(source, candidate, {
      curatedBoost: boostCodes.get(candidate.code) ?? 0,
      appliedRules: matchedRules.map((m) => m.rule.id),
      boosts: labels,
      sourceType: boostCodes.has(candidate.code) ? 'rule' : 'compatibility',
    });
    if (result && result.finalScore !== -Infinity) scored.push(result);
  }

  scored.sort((a, b) => b.finalScore - a.finalScore);

  let recommendations = scored
    .filter((s) => s.finalScore !== -Infinity)
    .slice(0, forcedLimit);

  // Fallback ladder if empty
  if (!recommendations.length) {
    const fallback = catalog
      .filter(
        (p) =>
          p.status === 'published' &&
          p.stock > 0 &&
          p.code !== source.code &&
          p.collection &&
          p.collection === source.collection,
      )
      .slice(0, forcedLimit)
      .map((p) =>
        scoreCandidate(source, p, {
          sourceType: 'fallback',
          appliedRules: [],
          boosts: ['fallback:same_collection'],
        }),
      )
      .filter(
        (x): x is ScoredRecommendation => !!x && x.finalScore !== -Infinity,
      );

    recommendations = fallback;
  }

  return {
    matchedRules,
    unmatchedRules,
    recommendations,
    conflicts,
  };
}
