import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { Component } from '@angular/core';
import { RouterOutlet, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [RouterOutlet, RouterModule],
  templateUrl: './layout.components.html',
  styleUrls: ['./layout.components.css']
})
export class LayoutComponents {
  sidebarOpen = false;

  constructor(public auth: AuthService) {}

  toggleSidebar(): void {
    this.sidebarOpen = !this.sidebarOpen;
  }

  closeSidebar(): void {
    this.sidebarOpen = false;
  }

  getUserInitials(): string {
    const name = this.auth.userName || 'Admin';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  }
}

export interface UserDto {
  id: string;
  userName: string;
  email: string;
  phoneNumber: string;
  roles: string[];
}

@Injectable({ providedIn: 'root' })
export class UserService {
  private http = inject(HttpClient);
  // Ensure this matches your actual ASP.NET Core controller route
  private apiUrl = 'http://localhost:5109/api/Users'; 

  getUsers(): Observable<UserDto[]> {
    return this.http.get<UserDto[]>(this.apiUrl);
  }

  assignRole(userId: string, roleName: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/assign-role`, { userId, roleName });
  }

  removeRole(userId: string, roleName: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/remove-role`, { userId, roleName });
  }
}
