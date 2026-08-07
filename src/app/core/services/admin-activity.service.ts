import { Injectable, signal } from '@angular/core';
import { environment } from '@env/environment';
import {
  AdminActivityAction,
  AdminActivityEntry
} from '@shared/models/admin-activity.model';

type CurrentActivityInput = {
  action: AdminActivityAction;
  actor: string;
  actorRole: string;
  summary: string;
  entityCode?: string;
};

type LegacyActivityInput = {
  type: 'photo_attached' | 'product_published' | 'inventory_import';
  title: string;
  description: string;
  actor?: string;
  productId?: string;
  productCode?: string;
};

@Injectable({ providedIn: 'root' })
export class AdminActivityService {
  private readonly storageKey = environment.storageKeys.adminActivity;
  private readonly entriesSignal = signal<AdminActivityEntry[]>(this.load());

  readonly entries = this.entriesSignal.asReadonly();

  log(input: CurrentActivityInput | LegacyActivityInput): void {
    const normalized = this.normalize(input);
    const entry: AdminActivityEntry = {
      id: `act-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      ...normalized,
      createdAt: new Date().toISOString()
    };

    this.entriesSignal.update((list) => [entry, ...list].slice(0, 200));
    this.persist();
  }

  recent(limit = 8): AdminActivityEntry[] {
    return this.entriesSignal().slice(0, limit);
  }

  clear(): void {
    this.entriesSignal.set([]);
    this.persist();
  }

  private normalize(input: CurrentActivityInput | LegacyActivityInput): Omit<AdminActivityEntry, 'id' | 'createdAt'> {
    if ('action' in input) return input;

    const action: AdminActivityAction = input.type === 'photo_attached'
      ? 'photo_attach'
      : input.type === 'product_published'
        ? 'publish'
        : 'import';

    return {
      action,
      actor: input.actor || 'system',
      actorRole: 'system',
      summary: `${input.title} — ${input.description}`,
      entityCode: input.productCode || input.productId
    };
  }

  private load(): AdminActivityEntry[] {
    try {
      const raw = localStorage.getItem(this.storageKey);
      if (!raw) return [];
      const parsed = JSON.parse(raw) as AdminActivityEntry[];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  private persist(): void {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.entriesSignal()));
    } catch {
      // ignore
    }
  }
}
