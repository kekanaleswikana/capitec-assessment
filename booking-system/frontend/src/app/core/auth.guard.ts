import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map } from 'rxjs';
import { AuthService } from './auth.service';

/** Lets an already-known admin through immediately; otherwise checks the session once (handles a page refresh). */
export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.currentAdmin()) {
    return true;
  }
  return auth.checkSession().pipe(
    map(admin => admin ? true : router.createUrlTree(['/admin/login'])),
  );
};
