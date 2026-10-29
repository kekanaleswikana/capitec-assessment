import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AdminApiService } from '../../core/admin-api.service';
import { AuthService } from '../../core/auth.service';
import { BookingApiService, errorMessage } from '../../core/booking-api.service';
import { AuditEntry, Booking, Resource } from '../../core/models';
import { prettyDate, timeOf, toDateTimeLocal } from '../../core/date-utils';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <section class="intro row spread">
      <div>
        <h1>All bookings</h1>
        <p class="muted">Signed in as {{ auth.currentAdmin()?.username }}.</p>
      </div>
      <button class="btn" type="button" (click)="logout()">Log out</button>
    </section>

    <div class="row tabs">
      <button class="btn" type="button" [class.primary]="view() === 'bookings'" (click)="view.set('bookings')">Bookings</button>
      <button class="btn" type="button" [class.primary]="view() === 'activity'" (click)="view.set('activity')">Activity log</button>
    </div>

    @if (view() === 'bookings') {
      <div class="card lookup">
        <label class="grow">
          <span class="sr-only">Filter</span>
          <input type="search" placeholder="Filter by customer, email or space…" [value]="filterText()"
                 (input)="filterText.set($any($event.target).value)" />
        </label>
        <label>
          <span class="sr-only">Date</span>
          <input type="date" [value]="filterDate()" (change)="filterDate.set($any($event.target).value)" />
        </label>
        @if (filterDate()) {
          <button class="btn" type="button" (click)="filterDate.set('')">Clear date</button>
        }
      </div>
    }

    @if (view() === 'bookings') {
    @if (loading()) {
      <p class="muted">Loading bookings…</p>
    } @else if (error()) {
      <div class="alert error">{{ error() }}</div>
    } @else if (filtered().length === 0) {
      <p class="muted">No bookings match.</p>
    } @else {
      <ul class="booking-list">
        @for (b of filtered(); track b.id) {
          <li class="card booking admin-booking" [class.cancelled]="b.status === 'CANCELLED'">
            @if (editingId() === b.id) {
              <form class="edit-form" [formGroup]="editForm" (ngSubmit)="saveEdit(b.id)">
                <div class="edit-grid">
                  <label>
                    Space
                    <select formControlName="resourceId">
                      @for (r of resources(); track r.id) {
                        <option [value]="r.id">{{ r.name }}</option>
                      }
                    </select>
                  </label>
                  <label>
                    Status
                    <select formControlName="status">
                      <option value="CONFIRMED">Confirmed</option>
                      <option value="CANCELLED">Cancelled</option>
                    </select>
                  </label>
                  <label>
                    Name
                    <input formControlName="customerName" />
                  </label>
                  <label>
                    Email
                    <input formControlName="customerEmail" type="email" />
                  </label>
                  <label>
                    Start
                    <input formControlName="startTime" type="datetime-local" />
                  </label>
                  <label>
                    End
                    <input formControlName="endTime" type="datetime-local" />
                  </label>
                  <label class="span-2">
                    Notes
                    <textarea formControlName="notes" rows="2"></textarea>
                  </label>
                </div>

                @if (editError()) { <div class="alert error">{{ editError() }}</div> }

                <div class="row">
                  <button class="btn primary" type="submit" [disabled]="editForm.invalid || saving()">
                    {{ saving() ? 'Saving…' : 'Save changes' }}
                  </button>
                  <button class="btn" type="button" (click)="cancelEdit()">Cancel</button>
                </div>
              </form>
            } @else {
              <div>
                <h3>{{ b.resourceName }}</h3>
                <p>{{ pretty(b.startTime) }} · {{ time(b.startTime) }}–{{ time(b.endTime) }}</p>
                <p class="muted small">{{ b.customerName }} · {{ b.customerEmail }}</p>
                @if (b.notes) { <p class="muted small">{{ b.notes }}</p> }
              </div>
              <div class="booking-actions">
                <span class="status" [class.ok]="b.status === 'CONFIRMED'">{{ b.status === 'CONFIRMED' ? 'Confirmed' : 'Cancelled' }}</span>
                <button class="btn" type="button" (click)="startEdit(b)">Edit</button>
              </div>
            }
          </li>
        }
      </ul>
    }
    }

    @if (view() === 'activity') {
      @if (auditLoading()) {
        <p class="muted">Loading activity…</p>
      } @else if (auditError()) {
        <div class="alert error">{{ auditError() }}</div>
      } @else if (audit().length === 0) {
        <p class="muted">No activity yet.</p>
      } @else {
        <ul class="booking-list">
          @for (a of audit(); track a.id) {
            <li class="card booking audit-entry">
              <div>
                <h3>{{ a.resourceName }} <span class="badge">{{ a.action }}</span></h3>
                <p>{{ pretty(a.createdAt) }} · {{ time(a.createdAt) }} — by {{ a.actor }}</p>
                <p class="muted small">{{ a.customerName }} · {{ a.customerEmail }} · booking #{{ a.bookingId }}</p>
                @if (a.details) { <p class="muted small">{{ a.details }}</p> }
              </div>
            </li>
          }
        </ul>
      }
    }
  `,
})
export class AdminDashboardComponent implements OnInit {
  readonly auth = inject(AuthService);
  private readonly adminApi = inject(AdminApiService);
  private readonly bookingApi = inject(BookingApiService);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);

  readonly view = signal<'bookings' | 'activity'>('bookings');

  readonly bookings = signal<Booking[]>([]);
  readonly resources = signal<Resource[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly filterText = signal('');
  readonly filterDate = signal('');
  readonly editingId = signal<number | null>(null);
  readonly saving = signal(false);
  readonly editError = signal<string | null>(null);

  readonly audit = signal<AuditEntry[]>([]);
  readonly auditLoading = signal(true);
  readonly auditError = signal<string | null>(null);

  readonly time = timeOf;
  readonly pretty = prettyDate;

  readonly filtered = computed(() => {
    const q = this.filterText().trim().toLowerCase();
    const date = this.filterDate();
    return this.bookings().filter(b => {
      if (date && b.startTime.slice(0, 10) !== date) return false;
      if (!q) return true;
      return b.customerName.toLowerCase().includes(q) ||
        b.customerEmail.toLowerCase().includes(q) ||
        b.resourceName.toLowerCase().includes(q);
    });
  });

  readonly editForm = this.fb.nonNullable.group({
    resourceId: [0, Validators.required],
    customerName: ['', [Validators.required, Validators.maxLength(120)]],
    customerEmail: ['', [Validators.required, Validators.email]],
    notes: [''],
    startTime: ['', Validators.required],
    endTime: ['', Validators.required],
    status: ['CONFIRMED' as 'CONFIRMED' | 'CANCELLED', Validators.required],
  });

  ngOnInit(): void {
    this.loading.set(true);
    this.bookingApi.getResources().subscribe({ next: list => this.resources.set(list) });
    this.adminApi.listAllBookings().subscribe({
      next: list => { this.bookings.set(list); this.loading.set(false); },
      error: err => { this.error.set(errorMessage(err)); this.loading.set(false); },
    });

    this.auditLoading.set(true);
    this.adminApi.listAudit().subscribe({
      next: list => { this.audit.set(list); this.auditLoading.set(false); },
      error: err => { this.auditError.set(errorMessage(err)); this.auditLoading.set(false); },
    });
  }

  startEdit(b: Booking): void {
    this.editError.set(null);
    this.editingId.set(b.id);
    this.editForm.setValue({
      resourceId: b.resourceId,
      customerName: b.customerName,
      customerEmail: b.customerEmail,
      notes: b.notes ?? '',
      startTime: toDateTimeLocal(b.startTime),
      endTime: toDateTimeLocal(b.endTime),
      status: b.status,
    });
  }

  cancelEdit(): void {
    this.editingId.set(null);
  }

  saveEdit(id: number): void {
    if (this.editForm.invalid) {
      this.editForm.markAllAsTouched();
      return;
    }
    this.editError.set(null);
    this.saving.set(true);
    const v = this.editForm.getRawValue();
    this.adminApi.updateBooking(id, {
      resourceId: Number(v.resourceId),
      customerName: v.customerName,
      customerEmail: v.customerEmail,
      notes: v.notes || undefined,
      startTime: v.startTime,
      endTime: v.endTime,
      status: v.status,
    }).subscribe({
      next: updated => {
        this.saving.set(false);
        this.editingId.set(null);
        this.bookings.update(list => list.map(b => (b.id === updated.id ? updated : b)));
        this.adminApi.listAudit().subscribe({ next: list => this.audit.set(list) });
      },
      error: err => { this.saving.set(false); this.editError.set(errorMessage(err)); },
    });
  }

  logout(): void {
    this.auth.logout().subscribe(() => this.router.navigateByUrl('/'));
  }
}
