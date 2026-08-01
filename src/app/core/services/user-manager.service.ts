import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '@env/environment';

export type ManagedUserRole = 'admin' | 'staff' | 'customer';

export interface ManagedUser {
  id: string;
  fullName: string;
  email: string;
  role: ManagedUserRole;
  permissions: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ManagedUserInput {
  fullName: string;
  email: string;
  password?: string;
  role: ManagedUserRole;
  permissions: string[];
  isActive?: boolean;
}

@Injectable({ providedIn: 'root' })
export class UserManagerService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.backendApiBaseUrl}/users`;

  list() { return this.http.get<ManagedUser[]>(this.url); }
  create(input: ManagedUserInput & { password: string }) { return this.http.post<ManagedUser>(this.url, input); }
  update(id: string, input: Partial<ManagedUserInput>) { return this.http.patch<ManagedUser>(`${this.url}/${id}`, input); }
  remove(id: string) { return this.http.delete<{ deleted: boolean }>(`${this.url}/${id}`); }
  updateMe(input: { fullName?: string; email?: string; password?: string }) {
    return this.http.patch<ManagedUser>(`${this.url}/me`, input);
  }
}
