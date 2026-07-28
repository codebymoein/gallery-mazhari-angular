import { Injectable } from '@angular/core';
import {
  ACCESSORY_STORE_CATEGORIES,
  BRIDAL_CLOTHING_CATEGORY,
  CatalogCategory
} from '@shared/data/catalog-categories';
import {
  BridalSampleProduct,
  BRIDAL_COLLECTION_CATEGORIES,
  getAllCatalogProducts
} from '@shared/data/bridal-collection-categories';

export interface SearchProductHit {
  id: string;
  name: string;
  image: string;
  tag: string;
  categorySlug: string;
  price: number;
  score: number;
}

export interface SearchCategoryHit {
  title: string;
  slug: string;
  image?: string;
  score: number;
}

export interface SmartSearchResult {
  query: string;
  exactProducts: SearchProductHit[];
  relatedProducts: SearchProductHit[];
  categories: SearchCategoryHit[];
  bestsellers: SearchProductHit[];
  /** Always true — smart search never returns empty/error UI. */
  hasSuggestions: true;
}

/** Stable numeric id for cart (string product ids → number). */
export function productIdToNumber(id: string): number {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash << 5) - hash + id.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash) || 1;
}

/** Mock luxury prices (IRR) derived from product id for stable display. */
export function mockPriceForProduct(id: string): number {
  const base = productIdToNumber(id);
  const tier = (base % 7) + 1;
  return 12_000_000 + tier * 3_500_000;
}

export function formatIrr(amount: number): string {
  return new Intl.NumberFormat('fa-IR').format(Math.round(amount)) + ' تومان';
}

@Injectable({ providedIn: 'root' })
export class SearchService {
  private readonly allCategories: CatalogCategory[] = [
    BRIDAL_CLOTHING_CATEGORY,
    ...ACCESSORY_STORE_CATEGORIES
  ];

  search(rawQuery: string): SmartSearchResult {
    const query = rawQuery.trim();
    const tokens = this.tokenize(query);

    const scoredProducts = getAllCatalogProducts().map(p => ({
      hit: this.toProductHit(p, 0),
      score: this.scoreProduct(p, tokens, query)
    }))
      .filter(x => x.score > 0)
      .sort((a, b) => b.score - a.score)
      .map(x => ({ ...x.hit, score: x.score }));

    const exactProducts = scoredProducts.filter(p => p.score >= 40).slice(0, 12);
    const relatedProducts = scoredProducts
      .filter(p => p.score < 40)
      .slice(0, 8);

    const categories = this.scoreCategories(tokens, query).slice(0, 6);
    const bestsellers = this.getBestsellers(8);

    // Never empty: if no matches, surface bestsellers + top categories.
    const safeRelated =
      exactProducts.length || relatedProducts.length
        ? relatedProducts
        : bestsellers.slice(0, 6);

    const safeCategories =
      categories.length > 0
        ? categories
        : BRIDAL_COLLECTION_CATEGORIES.slice(0, 4).map(c => ({
            title: c.title,
            slug: c.slug,
            image: c.image,
            score: 1
          }));

    return {
      query,
      exactProducts,
      relatedProducts: safeRelated,
      categories: safeCategories,
      bestsellers,
      hasSuggestions: true
    };
  }

  getBestsellers(limit = 8): SearchProductHit[] {
    return [...getAllCatalogProducts()]
      .sort((a, b) => productIdToNumber(a.id) - productIdToNumber(b.id))
      .slice(0, limit)
      .map((p, i) => this.toProductHit(p, 100 - i));
  }

  private toProductHit(p: BridalSampleProduct, score: number): SearchProductHit {
    return {
      id: p.id,
      name: p.name,
      image: p.image,
      tag: p.tag,
      categorySlug: p.categorySlug,
      price: mockPriceForProduct(p.id),
      score
    };
  }

  private scoreProduct(p: BridalSampleProduct, tokens: string[], query: string): number {
    if (!tokens.length && !query) {
      return 0;
    }
    const hay = [
      p.name,
      p.tag,
      p.description,
      p.silhouette,
      p.fabric,
      p.categorySlug,
      ...p.highlights
    ]
      .join(' ')
      .toLowerCase();

    let score = 0;
    if (query && p.name.includes(query)) score += 80;
    if (query && hay.includes(query.toLowerCase())) score += 30;

    for (const t of tokens) {
      if (p.name.toLowerCase().includes(t)) score += 25;
      else if (hay.includes(t)) score += 10;
    }

    // Soft synonym boosts (Persian bridal vocabulary)
    const synonyms: Record<string, string[]> = {
      تاج: ['تاج', 'crown', 'هدپیس'],
      تور: ['تور', 'veil'],
      ماهی: ['ماهی', 'mermaid'],
      اروپایی: ['اروپایی', 'european'],
      عربی: ['عربی', 'arabic'],
      نامزدی: ['نامزدی', 'engagement'],
      کفش: ['کفش', 'shoe'],
      کیف: ['کیف', 'bag']
    };
    for (const [key, words] of Object.entries(synonyms)) {
      if (tokens.some(t => words.includes(t) || t.includes(key))) {
        if (hay.includes(key) || words.some(w => hay.includes(w))) {
          score += 15;
        }
      }
    }

    return score;
  }

  private scoreCategories(tokens: string[], query: string): SearchCategoryHit[] {
    const hits: SearchCategoryHit[] = [];

    for (const cat of this.allCategories) {
      let score = 0;
      const blob = [cat.title, cat.subtitle ?? '', cat.slug, ...cat.subcategories.map(s => s.label)]
        .join(' ')
        .toLowerCase();

      if (query && blob.includes(query.toLowerCase())) score += 40;
      for (const t of tokens) {
        if (blob.includes(t)) score += 12;
      }
      if (score > 0) {
        hits.push({ title: cat.title, slug: cat.slug, image: cat.image, score });
      }

      for (const sub of cat.subcategories) {
        let subScore = 0;
        const subBlob = `${sub.label} ${sub.slug}`.toLowerCase();
        if (query && subBlob.includes(query.toLowerCase())) subScore += 35;
        for (const t of tokens) {
          if (subBlob.includes(t)) subScore += 10;
        }
        if (subScore > 0) {
          hits.push({ title: sub.label, slug: sub.slug, image: cat.image, score: subScore });
        }
      }
    }

    return hits.sort((a, b) => b.score - a.score);
  }

  private tokenize(query: string): string[] {
    return query
      .toLowerCase()
      .split(/[\s،,._\-]+/)
      .map(t => t.trim())
      .filter(t => t.length >= 2);
  }
}
