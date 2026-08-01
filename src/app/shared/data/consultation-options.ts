/**
 * Consultation form options
 */

import { CATALOG_CATEGORIES } from './catalog-categories';

export const CONSULTATION_CONTACT_TIMES: Readonly<Record<string, string>> = {
  anytime: 'هر زمان مناسب بود',
  morning: 'صبح، ۹ تا ۱۲',
  afternoon: 'ظهر، ۱۲ تا ۱۶',
  evening: 'عصر، ۱۶ تا ۲۰'
};

/** Products selectable on the main consultation form (when no product is pre-selected). */
export interface ConsultationTopicOption {
  id: string;
  label: string;
}

export const CONSULTATION_TOPIC_OPTIONS: readonly ConsultationTopicOption[] =
  CATALOG_CATEGORIES.map(category => ({
    id: category.slug,
    label: category.title
  }));

export type ConsultationSource = 'website' | 'homepage' | 'vip-product';

export interface ConsultationFormPayload {
  last_name: string;
  phone: string;
  ceremony_date: string;
  contact_time: string;
  message: string;
  consent: boolean;
  consultation_source: ConsultationSource;
  product_name?: string;
  product_id?: string;
  website?: string;
}
