import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

export interface UserDto {
  id?: number;
  userName: string;
  email: string;
  phoneNumber: string;
  roles: string[];
}

@Injectable({ providedIn: 'root' })
export class UserService {
  private http = inject(HttpClient);
  private roleApiUrl = 'http://localhost:5109/api/Role'; 
  private accountApiUrl = 'http://localhost:5109/api/Account';

  getUsers(): Observable<UserDto[]> {
    return forkJoin({
      rolesList: this.http.get<UserDto[]>(`${this.roleApiUrl}/all-users`).pipe(catchError(() => of([]))),
      accountsList: this.http.get<{ id: number; userName: string; email: string; phoneNumber: string }[]>(this.accountApiUrl).pipe(catchError(() => of([])))
    }).pipe(
      map(({ rolesList, accountsList }) => {
        return (rolesList || []).map((u) => {
          const match = (accountsList || []).find(
            (a) =>
              (a.phoneNumber && u.phoneNumber && a.phoneNumber.trim() === u.phoneNumber.trim()) ||
              (a.email && u.email && a.email.toLowerCase().trim() === u.email.toLowerCase().trim()) ||
              (a.userName && u.userName && a.userName.toLowerCase().trim() === u.userName.toLowerCase().trim())
          );
          return {
            ...u,
            id: match?.id
          };
        });
      })
    );
  }

  assignRole(phoneNumber: string, roleName: string): Observable<any> {
    return this.http.post(this.roleApiUrl, { phoneNumber, roleName });
  }

  removeRole(phoneNumber: string, roleName: string): Observable<any> {
    return this.http.post(`${this.roleApiUrl}/remove`, { phoneNumber, roleName });
  }

  deleteUser(id: number): Observable<any> {
    return this.http.delete(`${this.accountApiUrl}/${id}`);
  }
}
