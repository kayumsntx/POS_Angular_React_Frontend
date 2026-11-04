import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Role } from '../../models/role';
import { RoleService } from '../../services/role.service';


const BUILT_IN = ['Admin', 'POSOperator', 'Cashier', 'Salesman','User'];

@Component({
  selector: 'app-roles',
  imports: [ReactiveFormsModule],
  templateUrl: './roles.components.html',
})
export class RolesComponents implements OnInit {
  private fb = inject(FormBuilder);
  private roleService = inject(RoleService);

  roles = signal<Role[]>([]);
  message = signal<string>('');   
  success = signal<string>('');  

  roleForm = this.fb.group({
    roleName: ['', [Validators.required, Validators.minLength(2)]],
  });

  ngOnInit(): void {
    this.loadRoles();
  }

  loadRoles(): void {
    this.roleService.getRoles().subscribe({
      next: (data) => this.roles.set(data),
      error: (err) => this.showError(err),
    });
  }

  onSubmit(): void {
    if (this.roleForm.invalid) {
      this.roleForm.markAllAsTouched();
      return;
    }
    this.clearMessages();
    const roleName = this.roleForm.value.roleName!.trim();

    this.roleService.createRole(roleName).subscribe({
      next: (res) => {
        this.success.set(res.message);
        this.roleForm.reset({ roleName: '' });
        this.loadRoles();
      },
      error: (err) => this.showError(err),
    });
  }

  deleteRole(r: Role): void {
    if (!confirm(`Delete role "${r.roleName}"? Users who have this role will lose it.`)) return;
    this.clearMessages();

    this.roleService.deleteRole(r.id).subscribe({
      next: (res) => {
        this.success.set(res.message);
        this.loadRoles();
      },
      error: (err) => this.showError(err),
    });
  }

  isBuiltIn(name: string): boolean {
    return BUILT_IN.some((b) => b.toLowerCase() === name.toLowerCase());
  }

  private clearMessages(): void {
    this.message.set('');
    this.success.set('');
  }

  
  private showError(err: any): void {
    const e = err.error;
    if (e?.message) this.message.set(e.message);
    else if (Array.isArray(e?.errors)) this.message.set(e.errors.join(' '));
    else this.message.set('Something went wrong');
  }
}