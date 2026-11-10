import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = (route) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (!auth.isLoggedIn()) {
    return router.createUrlTree(['/login']);
  }

  const roles = route.data?.['roles'] as string[] | undefined;
  if (roles && !auth.hasRole(roles)) {
    return auth.hasRole(['User'])
      ? router.createUrlTree(['/home'])
      : router.createUrlTree(['/dashboard']);
  }
  return true;
};
