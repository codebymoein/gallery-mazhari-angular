import { Injectable } from '@angular/core';
import { CartItem } from '@shared/models';
import {
  getAllCatalogProducts,
  getBridalProductById
} from '@shared/data/bridal-collection-categories';
import {
  CATALOG_CATEGORIES,
  findCategoryForSubSlug,
  getCatalogCategoryBySlug
} from '@shared/data/catalog-categories';
import { productIdToNumber } from '@core/services/search.service';

const LAST_SHOP_KEY = 'mazhari_last_shop_path';

const BRIDAL_COLLECTION_SLUGS = new Set([
  'bridal-clothing',
  'arabic-bridal-dresses',
  'european-bridal-dresses',
  'mermaid-bridal-dresses',
  'engagement-dresses'
]);

/**
 * Resolves contextual "ادامه خرید" destinations based on cart / browse history.
 */
@Injectable({ providedIn: 'root' })
export class ShoppingContextService {
  /** Persist last visited shop/collection path (e.g. /shop/bridal-jewelry/earrings). */
  rememberPath(commands: string[]): void {
    if (!commands.length) {
      return;
    }
    try {
      sessionStorage.setItem(LAST_SHOP_KEY, JSON.stringify(commands));
    } catch {
      // ignore
    }
  }

  rememberFromUrl(url: string): void {
    const path = url.split('?')[0].split('#')[0];
    if (path.startsWith('/shop/') || path.startsWith('/collections/')) {
      const parts = path.split('/').filter(Boolean);
      this.rememberPath(['/', ...parts]);
    }
  }

  /**
   * Best continue-shopping route for current cart contents.
   * Preference: newest cart item category → last browsed shop → home accessories hub.
   */
  continueShoppingLink(items: CartItem[] | null | undefined): string[] {
    const fromCart = this.linkFromCartItems(items ?? []);
    if (fromCart) {
      return fromCart;
    }

    const remembered = this.readRemembered();
    if (remembered?.length) {
      return remembered;
    }

    return ['/shop', 'bridal-hair-accessories'];
  }

  linkForCategorySlug(categorySlug: string): string[] {
    if (!categorySlug) {
      return ['/'];
    }

    if (BRIDAL_COLLECTION_SLUGS.has(categorySlug)) {
      return ['/collections', categorySlug];
    }

    const parentCat = getCatalogCategoryBySlug(categorySlug);
    if (parentCat) {
      return ['/shop', parentCat.slug];
    }

    const found = findCategoryForSubSlug(categorySlug);
    if (found) {
      return ['/shop', found.category.slug, found.sub.slug];
    }

    return ['/catalog'];
  }

  private linkFromCartItems(items: CartItem[]): string[] | null {
    if (!items.length) {
      return null;
    }

    // Newest item first (by added_at), else last in array
    const sorted = [...items].sort((a, b) => {
      const ta = a.added_at ? Date.parse(a.added_at) : 0;
      const tb = b.added_at ? Date.parse(b.added_at) : 0;
      return tb - ta;
    });

    for (const item of sorted) {
      const slug =
        item.category_slug ||
        this.resolveSlugFromItem(item);

      if (slug) {
        return this.linkForCategorySlug(slug);
      }
    }

    return null;
  }

  private resolveSlugFromItem(item: CartItem): string | undefined {
    if (item.source_id) {
      return getBridalProductById(item.source_id)?.categorySlug;
    }

    const match = getAllCatalogProducts().find(
      p => productIdToNumber(p.id) === item.product_id
    );
    return match?.categorySlug;
  }

  private readRemembered(): string[] | null {
    try {
      const raw = sessionStorage.getItem(LAST_SHOP_KEY);
      if (!raw) {
        return null;
      }
      const parsed = JSON.parse(raw) as unknown;
      if (Array.isArray(parsed) && parsed.every(p => typeof p === 'string')) {
        return parsed as string[];
      }
    } catch {
      // ignore
    }
    return null;
  }
}

/** Convenience for templates / non-DI contexts. */
export function continueShoppingCommands(items: CartItem[]): string[] {
  // Lightweight duplicate of preference chain without session (items only)
  if (!items.length) {
    return ['/'];
  }
  const newest = [...items].sort((a, b) => {
    const ta = a.added_at ? Date.parse(a.added_at) : 0;
    const tb = b.added_at ? Date.parse(b.added_at) : 0;
    return tb - ta;
  })[0];

  const slug =
    newest.category_slug ||
    (newest.source_id ? getBridalProductById(newest.source_id)?.categorySlug : undefined) ||
    getAllCatalogProducts().find(p => productIdToNumber(p.id) === newest.product_id)?.categorySlug;

  if (!slug) {
    return ['/'];
  }

  if (BRIDAL_COLLECTION_SLUGS.has(slug)) {
    return ['/collections', slug];
  }
  const parent = getCatalogCategoryBySlug(slug);
  if (parent) {
    return ['/shop', parent.slug];
  }
  const found = findCategoryForSubSlug(slug);
  if (found) {
    return ['/shop', found.category.slug, found.sub.slug];
  }
  // Fallback: scan parents
  for (const cat of CATALOG_CATEGORIES) {
    if (cat.subcategories.some(s => s.slug === slug)) {
      return ['/shop', cat.slug, slug];
    }
  }
  return ['/'];
}
