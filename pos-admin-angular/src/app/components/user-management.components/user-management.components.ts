import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserService, UserDto } from '../../services/user.service';

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './user-management.components.html',
  styleUrls: ['./user-management.components.css']
})
export class UserManagementComponent implements OnInit {
  private userService = inject(UserService);
  
  users = signal<UserDto[]>([]);
  availableRoles = ['Admin', 'User', 'Cashier'];
  isLoading = signal<boolean>(true);
  errorMessage = signal<string>('');

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.isLoading.set(true);
    this.userService.getUsers().subscribe({
      next: (data: any) => {
        this.users.set(data);
        this.isLoading.set(false);
      },
      error: (err: any) => {
        this.errorMessage.set('Failed to load users.');
        this.isLoading.set(false);
      }
    });
  }

  // Updated to use phoneNumber since your backend UserRoleDto requires it
  onRoleChange(phoneNumber: string, role: string, event: Event): void {
    const isChecked = (event.target as HTMLInputElement).checked;
    
    if (isChecked) {
      this.userService.assignRole(phoneNumber, role).subscribe({
        next: () => this.loadUsers(),
        error: (err: any) => this.errorMessage.set(`Failed to assign role ${role}`)
      });
    } else {
      this.userService.removeRole(phoneNumber, role).subscribe({
        next: () => this.loadUsers(),
        error: (err: any) => this.errorMessage.set(`Failed to remove role ${role}`)
      });
    }
  }

  isSelf(user: UserDto): boolean {
    const currentUser = (localStorage.getItem('userName') || '').toLowerCase().trim();
    if (!currentUser) return false;
    return (
      (!!user.userName && user.userName.toLowerCase().trim() === currentUser) ||
      (!!user.email && user.email.toLowerCase().trim() === currentUser) ||
      (!!user.phoneNumber && user.phoneNumber.trim() === currentUser)
    );
  }

  deleteUser(user: UserDto): void {
    if (this.isSelf(user)) {
      this.errorMessage.set("You cannot delete your own account.");
      return;
    }

    if (!user.id) {
      this.errorMessage.set('Cannot find user ID to delete.');
      return;
    }

    if (!confirm(`Are you sure you want to permanently delete user "${user.userName}" (${user.email || user.phoneNumber})?`)) {
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');
    this.userService.deleteUser(user.id).subscribe({
      next: () => {
        this.loadUsers();
      },
      error: (err: any) => {
        this.errorMessage.set(err.error?.message || 'Failed to delete user.');
        this.isLoading.set(false);
      }
    });
  }
}
