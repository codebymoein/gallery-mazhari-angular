/**
 * Engraving Models
 * Product customization and engraving
 */

export interface EngravingOption {
  id: number;
  product_id: number;
  name: string;
  description: string;
  is_available: boolean;
  types: EngravingType[];
  max_characters?: number;
  price_adjustment?: number;
  fonts?: string[];
  positions?: EngravingPosition[];
}

export interface EngravingType {
  id: string;
  name: string;
  description?: string;
  icon?: string;
}

export interface EngravingPosition {
  id: string;
  name: string;
  description?: string;
  preview_image?: string;
}

export interface EngravingRequest {
  id?: number;
  order_id?: number;
  product_id: number;
  type: string;
  text: string;
  font?: string;
  position: string;
  price_adjustment?: number;
  notes?: string;
  preview_image?: string;
  status?: 'pending' | 'confirmed' | 'in_progress' | 'completed';
  created_at?: string;
  updated_at?: string;
}

export interface EngravingPreview {
  product_id: number;
  text: string;
  font: string;
  position: string;
  image_url: string;
}

export interface EngravingRequestInput {
  type: string;
  text: string;
  font: string;
  position: string;
  notes?: string;
}

export enum EngravingTypes {
  INITIALS = 'initials',
  DATE = 'date',
  NAME = 'name',
  QUOTE = 'quote',
  CUSTOM = 'custom'
}

export enum EngravingPositions {
  CENTER = 'center',
  LEFT = 'left',
  RIGHT = 'right',
  TOP = 'top',
  BOTTOM = 'bottom'
}
