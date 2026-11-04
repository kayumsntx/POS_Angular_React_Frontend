import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { MessageResponse, Role } from '../models/role';

@Injectable({ providedIn: 'root' })
export class RoleService {
  private apiUrl = 'http://localhost:5109/api/Role';
  private http = inject(HttpClient);

  getRoles(): Observable<Role[]> {
    return this.http.get<Role[]>(this.apiUrl);
  }

  createRole(roleName: string): Observable<MessageResponse> {
    return this.http.post<MessageResponse>(`${this.apiUrl}/create`, { roleName });
  }

  deleteRole(id: string): Observable<MessageResponse> {
    return this.http.delete<MessageResponse>(`${this.apiUrl}/delete/${id}`);
  }
}