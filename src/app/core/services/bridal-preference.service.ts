import { Injectable } from '@angular/core';

export interface BridalPreferenceProfile {
  bodyShape: string;
  faceShape: string;
  styles: string[];
  ceremony: string;
  priorities: string[];
  brideHeight?: number;
  groomHeight?: number;
}

const STORAGE_KEY = 'gallery_mazhari_bridal_preferences';

const TAG_MAP: Record<string, string[]> = {
  pear: ['مناسب اندام گلابی', 'فرم پرنسسی', 'یقه باز'],
  apple: ['مناسب اندام سیبی', 'فرم A-line', 'کشیده‌نما'],
  hourglass: ['مناسب اندام ساعت‌شنی', 'فرم ماهی', 'کمر جذب'],
  rectangle: ['مناسب اندام مستطیلی', 'فرم پرنسسی', 'حجم‌دهنده'],
  inverted: ['مناسب اندام مثلث معکوس', 'دامن پف‌دار', 'یقه ساده'],
  oval: ['مناسب صورت بیضی'], round: ['مناسب صورت گرد', 'تاج بلند'],
  square: ['مناسب صورت مربعی', 'تاج منحنی'], diamond: ['مناسب صورت لوزی', 'تاج ظریف'],
  heart: ['مناسب صورت قلبی', 'تاج کوتاه'], long: ['مناسب صورت کشیده', 'تاج کوتاه'],
  european: ['اروپایی', 'سبک اروپایی', 'مینیمال', 'ظریف', 'تاج اروپایی'], arabic: ['عربی', 'سبک عربی', 'پرکار'],
  classic: ['کلاسیک'], modern: ['مدرن'], romantic: ['رمانتیک', 'ظریف'], royal: ['سلطنتی', 'لوکس'],
  engagement: ['مناسب نامزدی'], contract: ['مناسب عقد'], wedding: ['مناسب عروسی'],
  photography: ['مناسب عکاسی'], party: ['مناسب جشن'],
  comfort: ['راحت', 'سبک وزن'], budget: ['اقتصادی'], statement: ['خاص', 'پرکار'], reusable: ['چندبار مصرف'],
  tallFootwear: ['پاشنه بلند', 'لژ بلند', 'کتونی لژدار']
};

@Injectable({ providedIn: 'root' })
export class BridalPreferenceService {
  save(profile: BridalPreferenceProfile): string[] {
    const tags = this.tagsFor(profile);
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ profile, tags, savedAt: new Date().toISOString() }));
    return tags;
  }

  tags(): string[] {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}').tags || []; } catch { return []; }
  }

  tagsFor(profile: BridalPreferenceProfile): string[] {
    return [...new Set([
      ...(TAG_MAP[profile.bodyShape] || []), ...(TAG_MAP[profile.faceShape] || []),
      ...profile.styles.flatMap(value => TAG_MAP[value] || []),
      ...(TAG_MAP[profile.ceremony] || []), ...profile.priorities.flatMap(value => TAG_MAP[value] || []),
      ...((profile.groomHeight || 0) - (profile.brideHeight || 0) > 10 ? TAG_MAP['tallFootwear'] : [])
    ])];
  }
}
