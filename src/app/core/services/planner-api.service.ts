import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { environment } from '@env/environment';
import { Observable } from 'rxjs';

export type CeremonyType = 'wedding' | 'aghd' | 'engagement' | 'bale-boroon' | 'formality';
export type PlannerTaskStatus = 'completed' | 'overdue' | 'upcoming' | 'later';

export interface PlannerTaskAction {
  kind: 'catalog' | 'consultation';
  target?: 'bridal' | 'accessories';
}

export interface PlannerTaskView {
  id: string;
  title: string;
  description: string;
  group: 'foundation' | 'style' | 'final';
  daysBefore: number;
  dueDate: string;
  status: PlannerTaskStatus;
  completed: boolean;
  action?: PlannerTaskAction;
}

export interface WeddingPlannerView {
  id: string;
  eventDate: string;
  ceremonyTypes: CeremonyType[];
  version: number;
  daysRemaining: number;
  phase: 'planning' | 'soon' | 'urgent' | 'today' | 'past';
  progress: { completed: number; total: number; percent: number };
  tasks: PlannerTaskView[];
  createdAt: string;
  updatedAt: string;
}

@Injectable({ providedIn: 'root' })
export class PlannerApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.backendApiBaseUrl}/planner`;

  getMine(): Observable<WeddingPlannerView | null> {
    return this.http.get<WeddingPlannerView | null>(`${this.baseUrl}/me`);
  }

  saveSetup(payload: {
    eventDate: string;
    ceremonyTypes: CeremonyType[];
    version?: number;
  }): Observable<WeddingPlannerView> {
    return this.http.put<WeddingPlannerView>(`${this.baseUrl}/me`, payload);
  }

  updateTask(taskId: string, completed: boolean, version: number): Observable<WeddingPlannerView> {
    return this.http.patch<WeddingPlannerView>(
      `${this.baseUrl}/me/tasks/${encodeURIComponent(taskId)}`,
      { completed, version },
    );
  }

  remove(version: number): Observable<{ deleted: true }> {
    return this.http.request<{ deleted: true }>('DELETE', `${this.baseUrl}/me`, {
      body: { version },
    });
  }
}
