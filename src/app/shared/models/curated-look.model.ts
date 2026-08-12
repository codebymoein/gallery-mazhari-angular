/**
 * Curated Look Models
 * Editorial looks and styling collections
 */

export interface CuratedLook {
  id: number;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  status: 'publish' | 'draft' | 'pending' | 'private';
  date: string;
  date_gmt: string;
  modified: string;
  modified_gmt: string;
  featured_media: number;
  featured_image_url?: string;
  meta: CuratedLookMeta;
  menu_order: number;
  acf?: Record<string, unknown>; // If using Advanced Custom Fields
}

export interface CuratedLookMeta {
  style: string;
  mood: string;
  ceremony: string;
  suitable_for: string;
  product_ids: number[];
  featured: boolean;
}

export interface CuratedLookDetail extends CuratedLook {
  products?: CuratedLookProduct[];
}

export interface CuratedLookProduct {
  id: number;
  name: string;
  price: string;
  image: string;
  category?: string;
}

export interface CuratedLookFilter {
  page?: number;
  per_page?: number;
  search?: string;
  featured?: boolean;
  order?: 'asc' | 'desc';
  orderby?: 'date' | 'title' | 'menu_order';
}
