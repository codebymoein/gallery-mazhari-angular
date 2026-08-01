import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '@env/environment';
import { Observable } from 'rxjs';

export interface BackendAuthResponse {
  accessToken: string;
  user: {
    id: string;
    email: string;
    role: 'admin' | 'staff' | 'customer';
    fullName?: string;
    permissions?: string[];
  };
}

export interface GalleryItem {
  id: string;
  title: string;
  imageUrl: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface GalleryListResponse {
  items: GalleryItem[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

@Injectable({ providedIn: 'root' })
export class BackendApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.backendApiBaseUrl;

  login(payload: { email: string; password: string }): Observable<BackendAuthResponse> {
    return this.http.post<BackendAuthResponse>(`${this.baseUrl}/auth/login`, payload);
  }

  bootstrapAdmin(payload: {
    setupKey: string;
    fullName: string;
    email: string;
    password: string;
  }): Observable<BackendAuthResponse> {
    return this.http.post<BackendAuthResponse>(`${this.baseUrl}/auth/bootstrap-admin`, payload);
  }

  forgotPassword(email: string): Observable<{ accepted: true }> {
    return this.http.post<{ accepted: true }>(`${this.baseUrl}/auth/forgot-password`, { email });
  }

  resetPassword(token: string, password: string): Observable<{ reset: true }> {
    return this.http.post<{ reset: true }>(`${this.baseUrl}/auth/reset-password`, { token, password });
  }

  logout(): Observable<{ loggedOut: true }> {
    return this.http.post<{ loggedOut: true }>(`${this.baseUrl}/auth/logout`, {});
  }

  getGallery(params?: { page?: number; limit?: number; search?: string }): Observable<GalleryListResponse> {
    const query = new URLSearchParams();
    if (params?.page) query.set('page', String(params.page));
    if (params?.limit) query.set('limit', String(params.limit));
    if (params?.search) query.set('search', params.search);
    const queryString = query.toString();
    const url = queryString ? `${this.baseUrl}/gallery?${queryString}` : `${this.baseUrl}/gallery`;
    return this.http.get<GalleryListResponse>(url);
  }

  createGalleryItem(payload: {
    title: string;
    imageUrl: string;
    description?: string;
  }): Observable<GalleryItem> {
    return this.http.post<GalleryItem>(`${this.baseUrl}/gallery`, payload);
  }

  updateGalleryItem(
    id: string,
    payload: Partial<{ title: string; imageUrl: string; description?: string }>,
  ): Observable<GalleryItem> {
    return this.http.patch<GalleryItem>(`${this.baseUrl}/gallery/${id}`, payload);
  }

  deleteGalleryItem(id: string): Observable<GalleryItem> {
    return this.http.delete<GalleryItem>(`${this.baseUrl}/gallery/${id}`);
  }

  uploadGalleryImage(file: File): Observable<{ imageUrl: string; filename: string }> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<{ imageUrl: string; filename: string }>(
      `${this.baseUrl}/gallery/upload`,
      formData,
    );
  }
}
