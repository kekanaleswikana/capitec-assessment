import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { errorMessage } from '../../core/booking-api.service';

@Component({
  selector: 'app-admin-login',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <section class="intro">
      <h1>Admin login</h1>
      <p class="muted">Staff access to manage every booking.</p>
    </section>

    <form class="card login-card" [formGroup]="form" (ngSubmit)="submit()" novalidate>
      <label>
        Username
        <input formControlName="username" autocomplete="username" />
      </label>
      <label>
        Password
        <input formControlName="password" type="password" autocomplete="current-password" />
      </label>

      @if (error()) { <div class="alert error">{{ error() }}</div> }

      <button class="btn primary wide" type="submit" [disabled]="form.invalid || submitting()">
        {{ submitting() ? 'Signing in…' : 'Sign in' }}
      </button>
    </form>
  `,
})
export class AdminLoginComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);

  readonly submitting = signal(false);
  readonly error = signal<string | null>(null);

  readonly form = this.fb.nonNullable.group({
    username: ['', Validators.required],
    password: ['', Validators.required],
  });

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.error.set(null);
    this.submitting.set(true);
    this.auth.login(this.form.getRawValue()).subscribe({
      next: () => { this.submitting.set(false); this.router.navigateByUrl('/admin'); },
      error: err => { this.submitting.set(false); this.error.set(errorMessage(err)); },
    });
  }
}
