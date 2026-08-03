import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface MediaZipGroup {
  productCode: string;
  files: string[];
  productId: string | null;
  productName: string | null;
  productStatus: string | null;
  category: string | null;
  match: 'queue' | 'published' | 'missing';
  requiresConfirmation: boolean;
}

export interface MediaZipInspection {
  totalFiles: number;
  validImages: number;
  invalidFiles: string[];
  groups: MediaZipGroup[];
}

export interface MediaUploadResult {
  attached: number;
  orphans: number;
  quarantined: number;
  skippedPublished: number;
  assets: unknown[];
}
import { environment } from '@env/environment';
import { AdminAuthService } from '@core/services/admin-auth.service';

@Injectable({ providedIn: 'root' })
export class PlatformApiService {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AdminAuthService);
  private readonly base = `${environment.backendApiBaseUrl}/platform`;

  private authOptions(extra?: { reportProgress?: boolean }): {
    headers: HttpHeaders;
    reportProgress?: boolean;
  } {
    const token = this.auth.user()?.accessToken || '';
    return {
      headers: new HttpHeaders({
        Authorization: token ? `Bearer ${token}` : ''
      }),
      ...extra
    };
  }

  dryRun(
    file: File,
    opts?: {
      mappingJson?: string;
      confirmUncertainMapping?: boolean;
      sourceTimestamp?: string;
      preserveInventory?: boolean;
    }
  ): Observable<unknown> {
    const fd = new FormData();
    fd.append('file', file, file.name);
    if (opts?.mappingJson) fd.append('mappingJson', opts.mappingJson);
    if (opts?.confirmUncertainMapping) fd.append('confirmUncertainMapping', 'true');
    if (opts?.sourceTimestamp) fd.append('sourceTimestamp', opts.sourceTimestamp);
    if (opts?.preserveInventory) fd.append('preserveInventory', 'true');
    return this.http.post(`${this.base}/import/dry-run`, fd, this.authOptions());
  }

  confirmImport(
    importId: string,
    inventoryStrategy: 'preserve_inventory' | 'full_replace' | 'incremental' = 'preserve_inventory'
  ): Observable<unknown> {
    return this.http.post(
      `${this.base}/import/${importId}/confirm`,
      { inventoryStrategy },
      this.authOptions()
    );
  }

  rollback(importId: string, productCodes?: string[]): Observable<unknown> {
    return this.http.post(
      `${this.base}/import/${importId}/rollback`,
      { productCodes },
      this.authOptions()
    );
  }

  listRuns(): Observable<unknown[]> {
    return this.http.get<unknown[]>(`${this.base}/import/runs`, this.authOptions());
  }

  getRun(id: string): Observable<unknown> {
    return this.http.get(`${this.base}/import/runs/${id}`, this.authOptions());
  }

  saveTemplate(body: {
    name: string;
    mapping: Record<string, string>;
    headerFingerprint: string;
  }): Observable<unknown> {
    return this.http.post(`${this.base}/import/templates`, body, this.authOptions());
  }

  listTemplates(): Observable<unknown[]> {
    return this.http.get<unknown[]>(`${this.base}/import/templates`, this.authOptions());
  }

  uploadMedia(files: FileList | File[]): Observable<unknown> {
    const fd = new FormData();
    Array.from(files).forEach((f) => fd.append('files', f, f.name));
    return this.http.post(`${this.base}/media/upload`, fd, this.authOptions());
  }

  inspectZip(file: File): Observable<MediaZipInspection> {
    const fd = new FormData();
    fd.append('file', file, file.name);
    return this.http.post<MediaZipInspection>(
      `${this.base}/media/inspect-zip`,
      fd,
      this.authOptions()
    );
  }

  uploadZip(file: File, confirmedPublishedCodes: string[] = []): Observable<MediaUploadResult> {
    const fd = new FormData();
    fd.append('file', file, file.name);
    fd.append('confirmedPublishedCodes', JSON.stringify(confirmedPublishedCodes));
    return this.http.post<MediaUploadResult>(
      `${this.base}/media/upload-zip`,
      fd,
      this.authOptions()
    );
  }

  orphans(): Observable<unknown[]> {
    return this.http.get<unknown[]>(`${this.base}/media/orphans`, this.authOptions());
  }

  quarantine(): Observable<unknown[]> {
    return this.http.get<unknown[]>(`${this.base}/media/quarantine`, this.authOptions());
  }

  reattachOrphans(): Observable<unknown> {
    return this.http.post(`${this.base}/media/reattach-orphans`, {}, this.authOptions());
  }

  mediaReport(): Observable<Record<string, number | string>> {
    return this.http.get<Record<string, number | string>>(
      `${this.base}/media/report`,
      this.authOptions()
    );
  }

  mediaMissing(limit = 200): Observable<unknown[]> {
    return this.http.get<unknown[]>(
      `${this.base}/media/missing?limit=${limit}`,
      this.authOptions()
    );
  }

  inventorySummary(): Observable<Record<string, number>> {
    return this.http.get<Record<string, number>>(
      `${this.base}/inventory/summary`,
      this.authOptions()
    );
  }

  autoGenerateCollections(): Observable<unknown> {
    return this.http.post(
      `${this.base}/collections/auto-generate`,
      {},
      this.authOptions()
    );
  }

  jobs(): Observable<unknown[]> {
    return this.http.get<unknown[]>(`${this.base}/jobs`, this.authOptions());
  }

  getJob(id: string): Observable<unknown> {
    return this.http.get(`${this.base}/jobs/${id}`, this.authOptions());
  }

  workflowQueue(status?: string): Observable<unknown[]> {
    const q = status ? `?status=${encodeURIComponent(status)}` : '';
    return this.http.get<unknown[]>(`${this.base}/workflow/queue${q}`, this.authOptions());
  }

  approve(productIds: string[], publish = false): Observable<unknown> {
    return this.http.post(
      `${this.base}/workflow/approve`,
      { productIds, publish },
      this.authOptions()
    );
  }

  reject(productIds: string[], reason: string): Observable<unknown> {
    return this.http.post(
      `${this.base}/workflow/reject`,
      { productIds, reason },
      this.authOptions()
    );
  }

  listRules(): Observable<unknown[]> {
    return this.http.get<unknown[]>(`${this.base}/rules`, this.authOptions());
  }

  saveRule(rule: Record<string, unknown>): Observable<unknown> {
    return this.http.post(`${this.base}/rules`, rule, this.authOptions());
  }

  simulate(productCode: string): Observable<unknown> {
    return this.http.get(
      `${this.base}/rules/simulate/${encodeURIComponent(productCode)}`,
      this.authOptions()
    );
  }

  analytics(): Observable<unknown> {
    return this.http.get(`${this.base}/recommendations/analytics`, this.authOptions());
  }

  pendingTags(): Observable<unknown[]> {
    return this.http.get<unknown[]>(`${this.base}/tags/pending`, this.authOptions());
  }

  approveTag(id: string): Observable<unknown> {
    return this.http.post(`${this.base}/tags/${id}/approve`, {}, this.authOptions());
  }

  listLooks(): Observable<unknown[]> {
    return this.http.get<unknown[]>(`${this.base}/looks`, this.authOptions());
  }

  saveLook(look: Record<string, unknown>): Observable<unknown> {
    return this.http.post(`${this.base}/looks`, look, this.authOptions());
  }

  audit(limit = 100): Observable<unknown[]> {
    return this.http.get<unknown[]>(
      `${this.base}/audit?limit=${limit}`,
      this.authOptions()
    );
  }

  taxonomy(): Observable<unknown[]> {
    return this.http.get<unknown[]>(`${this.base}/taxonomy`, this.authOptions());
  }
}
