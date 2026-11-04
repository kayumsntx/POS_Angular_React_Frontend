import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

export const adminGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isLoggedIn() && authService.hasRole(['Admin'])) {
    return true;
  }

  // Redirect to a safe page (e.g., dashboard or unauthorized error page)
  router.navigate(['/']);
  return false;
};