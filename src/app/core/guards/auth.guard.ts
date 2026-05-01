import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { TokenService } from '../services/token.service';

export const authGuard: CanActivateFn = () => {
  const tokenService = inject(TokenService);
  const router = inject(Router);

  if (tokenService.getAccessToken()) {
    return true;
  }
  return router.createUrlTree(['/login']);
};

export const adminGuard: CanActivateFn = () => {
  const tokenService = inject(TokenService);
  const router = inject(Router);

  if (tokenService.getAccessToken() && tokenService.isAdmin()) {
    return true;
  }

  if (!tokenService.getAccessToken()) {
    return router.createUrlTree(['/login']);
  }

  return router.createUrlTree(['/forbidden']);
};
