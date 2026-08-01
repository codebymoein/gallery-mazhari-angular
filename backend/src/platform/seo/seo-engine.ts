/**
 * Automatic SEO generation for Gallery Mazhari products.
 * Writes into product.seo JSON — never invents fake ratings/reviews.
 */

import { normalizeProductCode, normalizeText } from '../common/text-normalize';

export interface ProductSeoInput {
  code: string;
  name: string;
  category?: string | null;
  description?: string | null;
  color?: string | null;
  material?: string | null;
  brand?: string | null;
  price?: number | null;
  stock?: number | null;
  primaryImageUrl?: string | null;
  siteUrl?: string;
}

export interface ProductSeoPayload {
  slug: string;
  metaTitle: string;
  metaDescription: string;
  canonical: string;
  altTexts: {
    primary: string;
    galleryTemplate: string;
  };
  imageFileStem: string;
  openGraph: {
    title: string;
    description: string;
    image: string | null;
    type: 'product';
    locale: 'fa_IR';
  };
  twitter: {
    card: 'summary_large_image';
    title: string;
    description: string;
    image: string | null;
  };
  jsonLd: Record<string, unknown>;
  generatedAt: string;
}

const SITE_DEFAULT = 'https://gallery-mazhari.ir';

/** Lightweight FA/EN keyword → slug segment */
const SLUG_MAP: Array<[RegExp, string]> = [
  [/لباس\s*عروس|bridal\s*dress|wedding\s*dress/i, 'bridal-dress'],
  [/کفش|shoes?/i, 'wedding-shoes'],
  [/تاج|tiara/i, 'tiara'],
  [/تور|veil/i, 'veil'],
  [/دستکش|gloves?/i, 'gloves'],
  [/زیور|جواهر|jewelry|jewellery/i, 'jewelry'],
  [/اروپایی|european/i, 'european'],
  [/عربی|arabic/i, 'arabic'],
  [/شامپاین|champagne/i, 'champagne'],
  [/آیوری|ivory/i, 'ivory'],
  [/سفید|white/i, 'white'],
];

function clamp(text: string, max: number): string {
  const t = text.replace(/\s+/g, ' ').trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1).trim()}…`;
}

export function slugifyProduct(input: ProductSeoInput): string {
  const code = normalizeProductCode(input.code) || 'product';
  const hay = [input.name, input.category, input.color, input.material]
    .filter(Boolean)
    .join(' ');
  const parts: string[] = [code];
  for (const [re, seg] of SLUG_MAP) {
    if (re.test(hay) && !parts.includes(seg)) parts.push(seg);
    if (parts.length >= 4) break;
  }
  return parts
    .join('-')
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-');
}

export function generateProductSeo(
  input: ProductSeoInput,
  now = new Date(),
): ProductSeoPayload {
  const site = (input.siteUrl || SITE_DEFAULT).replace(/\/$/, '');
  const code = normalizeProductCode(input.code);
  const name = (input.name || code).trim();
  const category = (input.category || 'لباس عروس').trim();
  const slug = slugifyProduct(input);
  const canonical = `${site}/product/${encodeURIComponent(code)}`;

  const colorBit = input.color ? ` ${input.color}` : '';
  const materialBit = input.material ? ` ${input.material}` : '';

  const metaTitle = clamp(`${name} | ${category} | گالری مظهری`, 60);
  const metaDescription = clamp(
    input.description?.trim() ||
      `${name} از مجموعه ${category} گالری مظهری.${colorBit}${materialBit} مشاهده جزئیات، موجودی واقعی و تکمیل استایل عروس.`,
    160,
  );

  const altPrimary = clamp(
    `${name}${colorBit}${materialBit} — گالری مظهری`,
    120,
  );

  const image = input.primaryImageUrl || null;

  const offers =
    input.price != null && Number.isFinite(input.price)
      ? {
          '@type': 'Offer',
          priceCurrency: 'IRR',
          price: String(input.price),
          availability:
            (input.stock ?? 0) > 0
              ? 'https://schema.org/InStock'
              : 'https://schema.org/OutOfStock',
          url: canonical,
        }
      : undefined;

  const jsonLd: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name,
    sku: code,
    category,
    description: metaDescription,
    brand: {
      '@type': 'Brand',
      name: input.brand || 'گالری مظهری',
    },
    url: canonical,
    image: image ? [image] : undefined,
    offers,
  };

  return {
    slug,
    metaTitle,
    metaDescription,
    canonical,
    altTexts: {
      primary: altPrimary,
      galleryTemplate: `${name} — تصویر گالری {n} | گالری مظهری`,
    },
    imageFileStem: `${code}-${normalizeText(category).slice(0, 24) || 'product'}`,
    openGraph: {
      title: metaTitle,
      description: metaDescription,
      image,
      type: 'product',
      locale: 'fa_IR',
    },
    twitter: {
      card: 'summary_large_image',
      title: metaTitle,
      description: metaDescription,
      image,
    },
    jsonLd,
    generatedAt: now.toISOString(),
  };
}
