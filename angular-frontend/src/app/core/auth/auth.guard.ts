import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivateFn, Router, RouterStateSnapshot } from '@angular/router';
import { map } from 'rxjs';
import { from } from 'rxjs';
import { AuthService } from './auth.service';

export const authGuard: CanActivateFn = (
  _route: ActivatedRouteSnapshot,
  _state: RouterStateSnapshot,
) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  return from(auth.init()).pipe(
    map(() => {
      if (!auth.user()) {
        router.navigate(['/login']);
        return false;
      }
      return true;
    }),
  );
};
