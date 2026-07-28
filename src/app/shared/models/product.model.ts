/**
 * Product Models
 * WooCommerce product types and interfaces
 */

import { MetaData } from './common.model';

export interface Product {
  id: number;
  name: string;
  slug: string;
  permalink: string;
  type: string;
  status: 'publish' | 'draft' | 'pending' | 'private';
  description: string;
  short_description: string;
  sku: string;
  price: string;
  regular_price: string;
  sale_price: string;
  date_on_sale_from: string | null;
  date_on_sale_to: string | null;
  on_sale: boolean;
  purchasable: boolean;
  total_sales: number;
  virtual: boolean;
  downloadable: boolean;
  download_limit: number;
  download_expiry: number;
  external_url: string;
  button_text: string;
  tax_status: 'taxable' | 'shipping' | 'none';
  tax_class: string;
  manage_stock: boolean;
  stock_quantity: number | null;
  in_stock: boolean;
  backorders: 'no' | 'notify' | 'yes';
  backorders_allowed: boolean;
  backordered: boolean;
  sold_individually: boolean;
  weight: string;
  dimensions: ProductDimensions;
  shipping_class: string;
  shipping_class_id: number;
  images: ProductImage[];
  categories: ProductCategory[];
  tags: ProductTag[];
  attributes: ProductAttribute[];
  default_attributes: ProductAttribute[];
  variations: number[];
  grouped_products: number[];
  menu_order: number;
  meta_data: MetaData[];
  rating_count: number;
  average_rating: string;
  review_count: number;
}

export interface ProductDimensions {
  length: string;
  width: string;
  height: string;
}

export interface ProductImage {
  id: number;
  date_created: string;
  date_created_gmt: string;
  date_modified: string;
  date_modified_gmt: string;
  src: string;
  name: string;
  alt: string;
}

export interface ProductCategory {
  id: number;
  name: string;
  slug: string;
}

export interface ProductTag {
  id: number;
  name: string;
  slug: string;
}

export interface ProductAttribute {
  id: number;
  name: string;
  option: string;
  slug?: string;
}



export interface ProductFilter {
  page?: number;
  per_page?: number;
  search?: string;
  after?: string;
  before?: string;
  exclude?: number[];
  include?: number[];
  offset?: number;
  order?: 'asc' | 'desc';
  orderby?: 'date' | 'id' | 'include' | 'title' | 'slug' | 'price' | 'popularity' | 'rating';
  parent?: number;
  parent_exclude?: number[];
  type?: string;
  sku?: string;
  featured?: boolean;
  on_sale?: boolean;
  min_price?: number;
  max_price?: number;
  stock_status?: 'instock' | 'outofstock' | 'onbackorder';
}
