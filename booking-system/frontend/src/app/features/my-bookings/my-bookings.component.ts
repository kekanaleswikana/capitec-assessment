import { Component, OnInit, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { BookingApiService, errorMessage } from '../../core/booking-api.service';
import { Booking } from '../../core/models';
import { prettyDate, timeOf } from '../../core/date-utils';

// @ts-ignore
@Component({
  selector: 'app-my-bookings',
  standalone: true,
  imports: [FormsModule],
  template: `
    <section class="intro">
      <h1>My bookings</h1>
      <p class="muted">Enter the email you booked with.</p>
    </section>

    <form class="card lookup" (ngSubmit)="search()">
      <label class="grow">
        <span class="sr-only">Email</span>
        <input type="email" name="email" placeholder="you@example.com" [(ngModel)]="emailInput" required />
      </label>
      <button class="btn primary" type="submit">Find bookings</button>
    </form>
    @if (lookupError()) { <p class="field-error">{{ lookupError() }}</p> }

    @if (loading()) {
      <p class="muted">Loading…</p>
    } @else if (error()) {
      <div class="alert error">{{ error() }}</div>
    } @else if (searched()) {
      @if (bookings().length === 0) {
        <p class="muted">No bookings for that email yet.</p>
      } @else {
        <ul class="booking-list">
          @for (b of bookings(); track b.id) {
            <li class="card booking" [class.cancelled]="b.status === 'CANCELLED'">
              <div>
                <h3>{{ b.resourceName }}</h3>
                <p>{{ pretty(b.startTime) }} · {{ time(b.startTime) }}–{{ time(b.endTime) }}</p>
                @if (b.notes) { <p class="muted small">{{ b.notes }}</p> }
              </div>
              <div class="booking-actions">
                <span class="status" [class.ok]="b.status === 'CONFIRMED'">{{ b.status === 'CONFIRMED' ? 'Confirmed' : 'Cancelled' }}</span>
                @if (b.status === 'CONFIRMED' && b.reminderSent) {
                  <span class="badge">Reminder sent</span>
                }
                @if (b.status === 'CONFIRMED') {
                  <button class="btn danger" type="button" [disabled]="cancelling() === b.id" (click)="cancel(b)">
                    {{ cancelling() === b.id ? 'Cancelling…' : 'Cancel' }}
                  </button>
                }
              </div>
            </li>
          }
        </ul>
      }
    }
  `,
})
export class MyBookingsComponent implements OnInit {
  /** Optional ?email= query param, so the confirmation screen can link straight here. */
  readonly email = input<string>();

  private readonly api = inject(BookingApiService);
  private readonly router = inject(Router);

  emailInput = '';
  readonly bookings = signal<Booking[]>([]);
  readonly loading = signal(false);
  readonly searched = signal(false);
  readonly error = signal<string | null>(null);
  readonly lookupError = signal<string | null>(null);
  readonly cancelling = signal<number | null>(null);

  readonly time = timeOf;
  readonly pretty = prettyDate;

  ngOnInit(): void {
    const preset = this.email();
    if (preset) {
      this.emailInput = preset;
      this.load(preset);
    }
  }

  search(): void {
    const email = this.emailInput.trim();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      this.lookupError.set('Enter a valid email address');
      return;
    }
    this.lookupError.set(null);
    this.router.navigate([], { queryParams: { email }, replaceUrl: true });
    this.load(email);
  }

  private load(email: string): void {
    this.loading.set(true);
    this.error.set(null);
    this.api.getBookingsByEmail(email).subscribe({
      next: list => { this.bookings.set(list); this.loading.set(false); this.searched.set(true); },
      error: err => { this.error.set(errorMessage(err)); this.loading.set(false); },
    });
  }

  cancel(booking: Booking): void {
    if (!confirm(`Cancel ${booking.resourceName} at ${timeOf(booking.startTime)}?`)) {
      return;
    }
    this.cancelling.set(booking.id);
    this.api.cancelBooking(booking.id).subscribe({
      next: updated => {
        this.bookings.update(list => list.map(b => (b.id === updated.id ? updated : b)));
        this.cancelling.set(null);
      },
      error: err => { this.error.set(errorMessage(err)); this.cancelling.set(null); },
    });
  }
}
