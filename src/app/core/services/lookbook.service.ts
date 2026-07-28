import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export type LookbookCategory = 'dress' | 'crown' | 'shoes' | 'veil' | 'other';

export interface LookbookItem {
  id: string;
  name: string;
  category: LookbookCategory;
  image?: string;
  subtitle?: string;
}

@Injectable({ providedIn: 'root' })
export class LookbookService {
  private readonly brideNameSubject = new BehaviorSubject<string>('');
  private readonly itemsSubject = new BehaviorSubject<LookbookItem[]>([
    {
      id: 'dress-1',
      name: 'لباس عروس مدل ماهی',
      category: 'dress',
      subtitle: 'تulle و دانتل فرانسوی',
      image: 'assets/images/home-hero-bride.webp'
    },
    {
      id: 'crown-1',
      name: 'تاج کریستال سلطنتی',
      category: 'crown',
      subtitle: 'کریستال سواروسکی',
      image: 'assets/images/bridal-hair-accessories.webp'
    },
    {
      id: 'shoes-1',
      name: 'کفش ساتن عروس',
      category: 'shoes',
      subtitle: 'پاشنه ۸ سانتی'
    }
  ]);

  readonly brideName$: Observable<string> = this.brideNameSubject.asObservable();
  readonly items$: Observable<LookbookItem[]> = this.itemsSubject.asObservable();
  readonly count$: Observable<number> = this.items$.pipe(map(items => items.length));

  get brideName(): string {
    return this.brideNameSubject.value;
  }

  get items(): LookbookItem[] {
    return this.itemsSubject.value;
  }

  setBrideName(name: string): void {
    this.brideNameSubject.next(name.trim());
  }

  getByCategory(category: LookbookCategory): LookbookItem | undefined {
    return this.items.find(item => item.category === category);
  }

  addItem(item: LookbookItem): void {
    const withoutSameCategory = this.items.filter(i => i.category !== item.category);
    const withoutSameId = withoutSameCategory.filter(i => i.id !== item.id);
    this.itemsSubject.next([...withoutSameId, item]);
  }

  removeItem(id: string): void {
    this.itemsSubject.next(this.items.filter(item => item.id !== id));
  }

  clear(): void {
    this.itemsSubject.next([]);
  }

  /**
   * Mock PDF generation & share — logs a luxury catalog payload.
   * Replace with a real PDF lib (e.g. jsPDF) when ready.
   */
  generatePdfAndShare(): void {
    const title = this.brideName
      ? `کاتالوگ اختصاصی ${this.brideName}`
      : 'کاتالوگ اختصاصی عروس';

    const payload = {
      title,
      brand: 'گالری مظهری',
      items: this.items,
      generatedAt: new Date().toISOString()
    };

    console.log('[Gallery Mazhari · Lookbook PDF]', payload);

    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      void navigator
        .share({
          title,
          text: `${title} — گالری مظهری\n${this.items.map(i => `• ${i.name}`).join('\n')}`,
          url: typeof location !== 'undefined' ? location.href : undefined
        })
        .catch(() => {
          /* User cancelled share sheet */
        });
    }
  }
}
