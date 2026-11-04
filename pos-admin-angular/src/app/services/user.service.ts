import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface UserDto {
  userName: string;
  email: string;
  phoneNumber: string;
  roles: string[];
}

@Injectable({ providedIn: 'root' })
export class UserService {
  private http = inject(HttpClient);
  // 1. Updated to match [Route("api/[controller]")] for RoleController
  private apiUrl = 'http://localhost:5109/api/Role'; 

  getUsers(): Observable<UserDto[]> {
    // 2. Matches [HttpGet("all-users")]
    return this.http.get<UserDto[]>(`${this.apiUrl}/all-users`);
  }

  assignRole(phoneNumber: string, roleName: string): Observable<any> {
    // 3. Matches [HttpPost] (AssignRole) sending { PhoneNumber, RoleName }
    return this.http.post(this.apiUrl, { phoneNumber, roleName });
  }

  removeRole(phoneNumber: string, roleName: string): Observable<any> {
    // 4. Matches [HttpPost("remove")]
    return this.http.post(`${this.apiUrl}/remove`, { phoneNumber, roleName });
  }
}