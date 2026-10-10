import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const managerGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isLoggedIn) {
    router.navigate(['/login']);
    return false;
  }

  // Allow Manager and Admin
  if (authService.isManager || authService.isAdmin) {
    return true;
  }

  // Staff (USER) gets redirected to their roster schedule view
  router.navigate(['/roster']);
  return false;
};
