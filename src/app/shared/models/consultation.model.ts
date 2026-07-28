/**
 * Consultation Models
 */

import { MetaData } from './common.model';

export interface ConsultationRequest {
  id?: number;
  last_name: string;
  phone: string;
  ceremony_date: string;
  contact_time: string;
  product_name?: string;
  product_id?: string;
  message?: string;
  status?: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  created_at?: string;
  updated_at?: string;
  meta_data?: MetaData[];
}

export interface ConsultationFilter {
  status?: string;
  date_from?: string;
  date_to?: string;
}

export enum ConsultationStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  NO_SHOW = 'no_show'
}
