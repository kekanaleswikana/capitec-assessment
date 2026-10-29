import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { AdminUser, LoginRequest } from './models';

/**
 * Session-cookie auth: the backend sets an httpOnly session cookie on login, which the browser
 * sends automatically on every same-origin request after that — nothing to store here ourselves.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly base = '/api/auth';

  readonly currentAdmin = signal<AdminUser | null>(null);

  login(request: LoginRequest): Observable<AdminUser> {
    return this.http.post<AdminUser>(`${this.base}/login`, request)
      .pipe(tap(admin => this.currentAdmin.set(admin)));
  }

  logout(): Observable<void> {
    return this.http.post<void>(`${this.base}/logout`, {})
      .pipe(tap(() => this.currentAdmin.set(null)));
  }

  /** Restores admin state after a page refresh. Resolves even when not logged in (just clears state). */
  checkSession(): Observable<AdminUser | null> {
    return new Observable<AdminUser | null>(subscriber => {
      this.http.get<AdminUser>(`${this.base}/me`).subscribe({
        next: admin => { this.currentAdmin.set(admin); subscriber.next(admin); subscriber.complete(); },
        error: () => { this.currentAdmin.set(null); subscriber.next(null); subscriber.complete(); },
      });
    });
  }
}
