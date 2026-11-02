import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { LoginResponse } from '../models/auth';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private apiUrl = 'http://localhost:5109/api/Account';

  login(phoneNumber: string, password: string): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(`${this.apiUrl}/login`, { phoneNumber, password })
      .pipe(
        tap((res) => {
          localStorage.setItem('token', res.token);
          localStorage.setItem('role', res.role);
          localStorage.setItem('userName', res.userName);
          localStorage.setItem('expiresAt', res.expiresAt);
        }),
      );
  }

  register(email: string, phoneNumber: string, password: string): Observable<unknown> {
    return this.http.post(`${this.apiUrl}/register`, { email, phoneNumber, password });
  }

  logout(): void {
    localStorage.clear();
    this.router.navigate(['/login']);
  }

  get token(): string | null {
    return localStorage.getItem('token');
  }
  get role(): string {
    return localStorage.getItem('role') ?? '';
  }
  get userName(): string {
    return localStorage.getItem('userName') ?? '';
  }

  isLoggedIn(): boolean {
    const exp = localStorage.getItem('expiresAt');
    return !!this.token && !!exp && new Date(exp) > new Date();
  }

  hasRole(roles: string[]): boolean {
    return roles.some((r) => r.toLowerCase() === this.role.toLowerCase());
  }
}