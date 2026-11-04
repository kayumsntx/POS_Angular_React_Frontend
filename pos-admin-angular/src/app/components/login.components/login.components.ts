import { Component, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { Router, RouterModule } from '@angular/router'; // <-- RouterModule added here

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule], // <-- RouterModule added here
  templateUrl: './login.components.html',
  styleUrls: ['./login.components.css'] // (Optional: keep if you have a CSS file)
})
export class LoginComponent {
  form: FormGroup;
  error = signal<string>('');
  loading = signal<boolean>(false);

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private router: Router
  ) {
    this.form = this.fb.group({
      phoneNumber: ['', Validators.required],
      password: ['', Validators.required]
    });
  }

  onSubmit(): void {
    if (this.form.invalid) return;

    this.loading.set(true);
    this.error.set('');
    
    const { phoneNumber, password } = this.form.value;

    this.auth.login(phoneNumber, password).subscribe({
      next: () => {
        this.loading.set(false);
        this.router.navigate(['/']); // or wherever you redirect after login
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err.error?.message || 'Login failed');
      }
    });
  }
}