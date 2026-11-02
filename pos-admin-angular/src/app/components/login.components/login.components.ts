import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule],
  templateUrl: './login.components.html',
})
export class LoginComponents {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);

  error = signal<string>('');
  loading = signal<boolean>(false);

  form = this.fb.group({
    phoneNumber: ['', [Validators.required]],
    password: ['', [Validators.required]],
  });

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.loading.set(true);
    this.error.set('');
    const { phoneNumber, password } = this.form.value;

    this.auth.login(phoneNumber!, password!).subscribe({
      next: (res) => {
        this.loading.set(false);
        if (res.role === 'User') {
          // only for admin
          this.auth.logout();
          this.error.set('Only For Staff');
          return;
        }
        this.router.navigate(['/orders']);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err.error?.message ?? 'Login failed');
      },
    });
  }
}
