/**
 * Dream Canvas Models
 * Personalized collections/moodboard
 */

export interface DreamCanvas {
  id: string;
  user_id: string;
  title?: string;
  description?: string;
  items: DreamItem[];
  created_at: string;
  updated_at: string;
  is_shared: boolean;
  share_token?: string;
  is_public?: boolean;
}

export interface DreamItem {
  id: string;
  product_id: number;
  product_name?: string;
  product_image?: string;
  product_price?: string;
  notes?: string;
  added_at: string;
  order?: number;
}

export interface DreamCanvasShare {
  id: string;
  user_id: string;
  share_token: string;
  shared_at: string;
  expires_at?: string;
  recipient_email?: string;
}

export interface DreamCanvasExport {
  format: 'pdf' | 'image' | 'json' | 'csv';
  include_prices: boolean;
  include_notes: boolean;
  include_metadata: boolean;
}

export interface DreamCanvasFilter {
  search?: string;
  sort_by?: 'date_added' | 'name' | 'price';
  sort_order?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}
