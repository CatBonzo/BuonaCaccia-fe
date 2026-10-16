import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { SessionService } from './session.service';

/** Serve il login. */
export const authGuard: CanActivateFn = () => {
  const router = inject(Router);
  return inject(SessionService).loggedIn() ? true : router.createUrlTree(['/login']);
};

/** Serve un permesso: `data: { entitlement: 'evento:gestione' }`. Il backend resta l'ultima parola. */
export const entitlementGuard: CanActivateFn = (route) => {
  const router = inject(Router);
  const needed = route.data['entitlement'] as string | undefined;
  return !needed || inject(SessionService).can(needed) ? true : router.createUrlTree(['/']);
};
