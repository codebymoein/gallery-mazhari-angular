import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '@env/environment';

export interface DreamCanvasItem {
  productId: number;
  name: string;
  image?: string;
  price?: string;
  slug?: string;
  addedAt: string;
}

interface StoredCanvas {
  ids: number[];
  items: DreamCanvasItem[];
  expiresAt: number;
}

@Injectable({ providedIn: 'root' })
export class DreamCanvasService {
  readonly maxItems = 60;
  private readonly storageKey = environment.storageKeys.dreamCanvas;
  private readonly storageDays = 180;
  private readonly itemsSubject = new BehaviorSubject<DreamCanvasItem[]>([]);
  private readonly openSubject = new BehaviorSubject<boolean>(false);
  private readonly announcementSubject = new BehaviorSubject<string>('');

  readonly items$: Observable<DreamCanvasItem[]> = this.itemsSubject.asObservable();
  readonly count$: Observable<number> = this.items$.pipe(map((items) => items.length));
  readonly isOpen$: Observable<boolean> = this.openSubject.asObservable();
  readonly announcement$: Observable<string> = this.announcementSubject.asObservable();

  constructor() {
    this.itemsSubject.next(this.readStorage());
  }

  get items(): DreamCanvasItem[] {
    return this.itemsSubject.value;
  }

  get count(): number {
    return this.items.length;
  }

  isOpen(): boolean {
    return this.openSubject.value;
  }

  open(): void {
    this.openSubject.next(true);
  }

  close(): void {
    this.openSubject.next(false);
  }

  toggle(): void {
    this.openSubject.next(!this.openSubject.value);
  }

  has(productId: number): boolean {
    return this.items.some((item) => item.productId === productId);
  }

  add(item: Omit<DreamCanvasItem, 'addedAt'>): boolean {
    if (this.has(item.productId)) {
      return false;
    }

    if (this.items.length >= this.maxItems) {
      this.announce(
        'ظرفیت بوم رویایی به ۶۰ انتخاب رسیده است؛ برای افزودن مورد تازه، یکی از انتخاب‌ها را حذف کنید.'
      );
      return false;
    }

    const next: DreamCanvasItem[] = [
      ...this.items,
      { ...item, addedAt: new Date().toISOString() }
    ];
    this.persist(next);
    this.announce(`«${item.name}» به بوم رویایی اضافه شد.`);
    return true;
  }

  remove(productId: number): void {
    const target = this.items.find((item) => item.productId === productId);
    const next = this.items.filter((item) => item.productId !== productId);
    this.persist(next);
    if (target) {
      this.announce(`«${target.name}» از بوم رویایی حذف شد.`);
    }
  }

  clearAnnouncement(): void {
    this.announcementSubject.next('');
  }

  private announce(message: string): void {
    this.announcementSubject.next(message);
  }

  private persist(items: DreamCanvasItem[]): void {
    this.itemsSubject.next(items);

    try {
      const payload: StoredCanvas = {
        ids: items.map((item) => item.productId),
        items,
        expiresAt: Date.now() + this.storageDays * 24 * 60 * 60 * 1000
      };
      localStorage.setItem(this.storageKey, JSON.stringify(payload));
    } catch {
      this.announce(
        'انتخاب در این صفحه باقی ماند، اما مرورگر اجازه ذخیره دائمی نداد.'
      );
    }
  }

  private readStorage(): DreamCanvasItem[] {
    try {
      const raw = localStorage.getItem(this.storageKey);
      if (!raw) {
        return [];
      }

      const parsed = JSON.parse(raw) as StoredCanvas;
      if (!parsed || !Array.isArray(parsed.items)) {
        localStorage.removeItem(this.storageKey);
        return [];
      }

      if (parsed.expiresAt && parsed.expiresAt < Date.now()) {
        localStorage.removeItem(this.storageKey);
        return [];
      }

      return parsed.items.slice(0, this.maxItems);
    } catch {
      return [];
    }
  }
}
