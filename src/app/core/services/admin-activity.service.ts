import { Injectable, signal } from '@angular/core';
import { environment } from '@env/environment';
import {
  AdminActivityAction,
  AdminActivityEntry
} from '@shared/models/admin-activity.model';

@Injectable({ providedIn: 'root' })
export class AdminActivityService {
  private readonly storageKey = environment.storageKeys.adminActivity;
  private readonly entriesSignal = signal<AdminActivityEntry[]>(this.load());

  readonly entries = this.entriesSignal.asReadonly();

  log(input: {
    action: AdminActivityAction;
    actor: string;
    actorRole: string;
    summary: string;
    entityCode?: string;
  }): void {
    const entry: AdminActivityEntry = {
      id: `act-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      action: input.action,
      actor: input.actor,
      actorRole: input.actorRole,
      summary: input.summary,
      entityCode: input.entityCode,
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
