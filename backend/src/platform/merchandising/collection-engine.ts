/**
 * Auto-generate curated bridal collections from hidden tag clusters.
 * Looks are created as draft — never auto-published.
 */

import { normalizeText } from '../common/text-normalize';

export interface CollectionSeed {
  name: string;
  slug: string;
  story: string;
  style?: string;
  mood?: string;
  ceremony?: string;
  /** Tag values that qualify a product (any match) */
  requiredAnyTags: string[];
  displayPriority: number;
}

export const AUTO_COLLECTION_SEEDS: CollectionSeed[] = [
  {
    name: 'Garden Wedding',
    slug: 'garden-wedding',
    story: 'استایل باغ و فضای باز — سبک، رمانتیک و هماهنگ با طبیعت',
    ceremony: 'Garden Wedding',
    mood: 'Romantic',
    requiredAnyTags: ['Garden', 'Outdoor Wedding', 'Garden Compatible'],
    displayPriority: 90,
  },
  {
    name: 'Luxury Classic',
    slug: 'luxury-classic',
    story: 'کلاسیک لوکس برای مراسم رسمی و مجلل',
    style: 'Classic',
    mood: 'Luxury',
    requiredAnyTags: ['Luxury', 'Classic', 'Formal'],
    displayPriority: 85,
  },
  {
    name: 'Minimal Ceremony',
    slug: 'minimal-ceremony',
    story: 'مینیمال و مدرن برای مراسم خلوت و شیک',
    style: 'Minimal',
    mood: 'Modern',
    requiredAnyTags: ['Minimal', 'Modern'],
    displayPriority: 80,
  },
  {
    name: 'Royal Collection',
    slug: 'royal-collection',
    story: 'نگاه شاهانه با جزئیات پرنسسی',
    mood: 'Princess',
    requiredAnyTags: ['Princess', 'Luxury', 'Royal'],
    displayPriority: 88,
  },
  {
    name: 'European Collection',
    slug: 'european-collection',
    story: 'مجموعه اروپایی گالری مظهری',
    style: 'European Style',
    requiredAnyTags: ['European Style', 'European'],
    displayPriority: 92,
  },
  {
    name: 'Arabic Collection',
    slug: 'arabic-collection',
    story: 'مجموعه عربی با شکوه و جزئیات غنی',
    style: 'Arabic Style',
    requiredAnyTags: ['Arabic Style', 'Arabic'],
    displayPriority: 91,
  },
];

export interface TaggedProductRef {
  code: string;
  tags: string[];
  status?: string;
  stock?: number;
}

/**
 * Match products to collection seeds by hidden tag overlap.
 * Only includes products that have at least one matching tag.
 */
export function matchProductsToCollections(
  products: TaggedProductRef[],
  seeds: CollectionSeed[] = AUTO_COLLECTION_SEEDS,
  opts?: { minProducts?: number; inStockOnly?: boolean },
): Array<CollectionSeed & { productCodes: string[]; matchCount: number }> {
  const minProducts = opts?.minProducts ?? 3;
  const inStockOnly = opts?.inStockOnly ?? false;

  return seeds
    .map((seed) => {
      const want = seed.requiredAnyTags.map((t) => normalizeText(t));
      const productCodes = products
        .filter((p) => {
          if (inStockOnly && (p.stock ?? 0) <= 0) return false;
          if (
            p.status &&
            p.status !== 'published' &&
            p.status !== 'approved' &&
            p.status !== 'enrichment_pending' &&
            p.status !== 'ready_for_approval' &&
            p.status !== 'draft'
          ) {
            // still allow draft for operator curation of auto looks
          }
          const have = (p.tags || []).map((t) => normalizeText(t));
          return want.some((w) =>
            have.some((h) => h === w || h.includes(w) || w.includes(h)),
          );
        })
        .map((p) => p.code);

      return {
        ...seed,
        productCodes,
        matchCount: productCodes.length,
      };
    })
    .filter((c) => c.matchCount >= minProducts);
}
