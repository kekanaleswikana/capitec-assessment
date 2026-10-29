import { Component, OnInit, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from './core/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <header class="topbar">
      <a routerLink="/" class="brand">
        <span class="brand-mark" aria-hidden="true"></span>
        Capitec Boardroom Booking
      </a>
      <nav>
        @if (auth.currentAdmin()) {
          <a routerLink="/admin" routerLinkActive="active">Admin</a>
          <button type="button" class="nav-link-btn" (click)="logout()">Log out</button>
        } @else {
          <a routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }">Spaces</a>
          <a routerLink="/my-bookings" routerLinkActive="active">My bookings</a>
          <a routerLink="/admin/login" routerLinkActive="active">Admin</a>
        }
      </nav>
    </header>
    <main class="page">
      <router-outlet />
    </main>
  `,
})
export class AppComponent implements OnInit {
  readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  ngOnInit(): void {
    this.auth.checkSession().subscribe();
  }

  logout(): void {
    this.auth.logout().subscribe(() => this.router.navigateByUrl('/'));
  }
}
