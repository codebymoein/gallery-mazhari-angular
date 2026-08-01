/**
 * Similarity helpers for hidden-tag relationship scoring.
 * Designed to be replaceable by embedding cosine in future AI layer.
 */

import { normalizeText } from '../common/text-normalize';

export function jaccardSimilarity(a: string[], b: string[]): number {
  const A = new Set(a.map((x) => normalizeText(x)).filter(Boolean));
  const B = new Set(b.map((x) => normalizeText(x)).filter(Boolean));
  if (!A.size && !B.size) return 0;
  let inter = 0;
  for (const x of A) if (B.has(x)) inter += 1;
  const union = A.size + B.size - inter;
  return union === 0 ? 0 : inter / union;
}

/** Psychology widget catalog — labels only; scoring is shared. */
export const PSYCHOLOGY_WIDGETS: Record<
  string,
  { labelFa: string; labelEn: string; emphasizeLuxury?: boolean }
> = {
  complete_your_bridal_look: {
    labelFa: 'تکمیل استایل عروس شما',
    labelEn: 'Complete Your Bridal Look',
  },
  customers_also_completed: {
    labelFa: 'مشتریان نیز استایل خود را با این‌ها کامل کردند',
    labelEn: 'Customers also completed their look with',
  },
  perfect_match: {
    labelFa: 'هماهنگی کامل',
    labelEn: 'Perfect Match',
  },
  mazhari_stylist: {
    labelFa: 'پیشنهاد استایلیست مظهری',
    labelEn: 'Mazhari Stylist Recommendation',
  },
  frequently_chosen_together: {
    labelFa: 'اغلب با هم انتخاب می‌شوند',
    labelEn: 'Frequently Chosen Together',
  },
  recommended_for_your_style: {
    labelFa: 'پیشنهادی برای سبک شما',
    labelEn: 'Recommended For Your Style',
  },
  luxury_combination: {
    labelFa: 'ترکیب لوکس',
    labelEn: 'Luxury Combination',
    emphasizeLuxury: true,
  },
};

/**
 * Real inventory urgency only — never fabricated scarcity.
 */
export function inventoryUrgencyLabel(
  stock: number,
  lowStockThreshold = 2,
): string | null {
  if (stock <= 0) return null;
  if (stock <= lowStockThreshold) {
    return `تنها ${stock} عدد باقی مانده`;
  }
  return null;
}
