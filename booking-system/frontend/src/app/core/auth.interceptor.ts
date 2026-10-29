import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from './auth.service';

/** A 401 on an admin call means the session expired mid-use — clear state and bounce to login. */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  return next(req).pipe(
    catchError(err => {
      if (err?.status === 401 && req.url.startsWith('/api/admin')) {
        auth.currentAdmin.set(null);
        router.navigate(['/admin/login']);
      }
      return throwError(() => err);
    }),
  );
};
