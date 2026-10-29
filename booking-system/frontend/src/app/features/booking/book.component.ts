import { Component, OnInit, computed, inject, input, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { BookingApiService, errorMessage } from '../../core/booking-api.service';
import { Booking, Resource, Slot } from '../../core/models';
import { prettyDate, timeOf, toIsoDate } from '../../core/date-utils';

@Component({
  selector: 'app-book',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <a routerLink="/" class="back">← All spaces</a>

    @if (resource(); as r) {
      <section class="intro">
        <h1>{{ r.name }}</h1>
        <p class="muted">{{ r.description }}</p>
      </section>
    }

    @if (confirmed(); as b) {
      <div class="card success-card">
        <h2>You're booked</h2>
        <p><strong>{{ b.resourceName }}</strong> on {{ pretty(b.startTime) }}, {{ time(b.startTime) }}–{{ time(b.endTime) }}.</p>
        <p class="muted">Booking #{{ b.id }} · confirmation for {{ b.customerEmail }}</p>
        <div class="row">
          <a class="btn primary" routerLink="/my-bookings" [queryParams]="{ email: b.customerEmail }">View my bookings</a>
          <button class="btn" type="button" (click)="bookAnother()">Book another slot</button>
        </div>
      </div>
    } @else {
      <div class="book-layout">
        <section class="card">
          <div class="row spread">
            <h2>1. Pick a slot</h2>
            <label class="date-field">
              <span class="sr-only">Date</span>
              <input type="date" [value]="date()" [min]="today" (change)="onDateChange($event)" />
            </label>
          </div>

          @if (slotsLoading()) {
            <p class="muted">Checking availability…</p>
          } @else if (slots().length === 0) {
            <p class="muted">No slots on this day.</p>
          } @else {
            <div class="slots">
              @for (s of slots(); track s.start; let i = $index) {
                <button type="button" class="slot"
                        [class.selected]="inSelectedRange(i)"
                        [disabled]="!s.available"
                        (click)="selectSlot(i)">
                  {{ time(s.start) }}
                </button>
              }
            </div>
            <p class="muted small">{{ freeCount() }} of {{ slots().length }} slots free · greyed-out slots are taken or in the past</p>
          }
        </section>

        <section class="card">
          <h2>2. Your details</h2>
          @if (selected(); as s) {
            <p class="chosen">{{ pretty(s.start) }} · {{ time(s.start) }}–{{ time(bookingEndTime()) }}</p>
            <label class="duration-field">
              Duration
              <select (change)="onDurationChange($event)">
                @for (n of durationChoices(); track n) {
                  <option [value]="n" [selected]="n === durationSlots()">{{ formatDuration(n) }}</option>
                }
              </select>
            </label>
          } @else {
            <p class="muted">Choose a slot first.</p>
          }

          <form [formGroup]="form" (ngSubmit)="submit()" novalidate>
            <label>
              Full name
              <input formControlName="customerName" autocomplete="name" />
              @if (showError('customerName')) { <small class="field-error">Enter your name</small> }
            </label>
            <label>
              Email
              <input formControlName="customerEmail" type="email" autocomplete="email" />
              @if (showError('customerEmail')) { <small class="field-error">Enter a valid email</small> }
            </label>
            <label>
              Notes <span class="muted">(optional)</span>
              <textarea formControlName="notes" rows="3"></textarea>
            </label>

            @if (submitError()) { <div class="alert error">{{ submitError() }}</div> }

            <button class="btn primary wide" type="submit" [disabled]="!selected() || submitting()">
              {{ submitting() ? 'Booking…' : 'Confirm booking' }}
            </button>
          </form>
        </section>
      </div>
    }
  `,
})
export class BookComponent implements OnInit {
  /** Bound from the :id route param (withComponentInputBinding). */
  readonly id = input.required<string>();

  private readonly api = inject(BookingApiService);
  private readonly fb = inject(FormBuilder);

  readonly today = toIsoDate(new Date());
  readonly resource = signal<Resource | null>(null);
  readonly date = signal(this.today);
  readonly slots = signal<Slot[]>([]);
  readonly slotsLoading = signal(false);
  readonly selectedIndex = signal<number | null>(null);
  readonly durationSlots = signal(1);
  readonly submitting = signal(false);
  readonly submitError = signal<string | null>(null);
  readonly confirmed = signal<Booking | null>(null);
  readonly freeCount = computed(() => this.slots().filter(s => s.available).length);

  /** The slot the customer clicked on — the start of the (possibly multi-slot) booking. */
  readonly selected = computed<Slot | null>(() => {
    const i = this.selectedIndex();
    return i === null ? null : this.slots()[i] ?? null;
  });

  /** How many consecutive free slots follow the selected one, so the duration picker never offers an impossible range. */
  readonly maxDurationSlots = computed(() => {
    const i = this.selectedIndex();
    if (i === null) return 1;
    const list = this.slots();
    let count = 0;
    for (let j = i; j < list.length && list[j].available; j++) count++;
    return Math.max(count, 1);
  });

  readonly durationChoices = computed(() => Array.from({ length: this.maxDurationSlots() }, (_, k) => k + 1));

  /** '' when nothing is selected, so templates can treat it like any other string field. */
  readonly bookingEndTime = computed(() => {
    const i = this.selectedIndex();
    if (i === null) return '';
    const list = this.slots();
    return list[i + this.durationSlots() - 1]?.end ?? list[i].end;
  });

  readonly form = this.fb.nonNullable.group({
    customerName: ['', [Validators.required, Validators.maxLength(120)]],
    customerEmail: ['', [Validators.required, Validators.email]],
    notes: ['', Validators.maxLength(500)],
  });

  readonly time = timeOf;
  readonly pretty = prettyDate;

  ngOnInit(): void {
    this.api.getResource(this.resourceId).subscribe({
      next: r => this.resource.set(r),
      error: err => this.submitError.set(errorMessage(err)),
    });
    this.loadSlots();
  }

  private get resourceId(): number {
    return Number(this.id());
  }

  onDateChange(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    if (value) {
      this.date.set(value);
      this.loadSlots();
    }
  }

  loadSlots(): void {
    this.selectedIndex.set(null);
    this.durationSlots.set(1);
    this.slotsLoading.set(true);
    this.api.getAvailability(this.resourceId, this.date()).subscribe({
      next: slots => { this.slots.set(slots); this.slotsLoading.set(false); },
      error: err => { this.slots.set([]); this.slotsLoading.set(false); this.submitError.set(errorMessage(err)); },
    });
  }

  selectSlot(index: number): void {
    this.selectedIndex.set(index);
    this.durationSlots.set(1);
  }

  inSelectedRange(index: number): boolean {
    const i = this.selectedIndex();
    return i !== null && index >= i && index < i + this.durationSlots();
  }

  onDurationChange(event: Event): void {
    const value = Number((event.target as HTMLSelectElement).value);
    this.durationSlots.set(value);
  }

  /** e.g. 2 slots of a 45-min resource -> "1 hr 30 min". */
  formatDuration(slotCount: number): string {
    const totalMinutes = slotCount * (this.resource()?.slotMinutes ?? 0);
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;
    if (h === 0) return `${m} min`;
    if (m === 0) return `${h} hr${h > 1 ? 's' : ''}`;
    return `${h} hr${h > 1 ? 's' : ''} ${m} min`;
  }

  showError(name: 'customerName' | 'customerEmail'): boolean {
    const c = this.form.controls[name];
    return c.invalid && (c.touched || c.dirty);
  }

  submit(): void {
    const slot = this.selected();
    const endTime = this.bookingEndTime();
    this.submitError.set(null);
    if (!slot || !endTime) {
      this.submitError.set('Pick a time slot first.');
      return;
    }
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.submitting.set(true);
    const v = this.form.getRawValue();
    this.api.createBooking({
      resourceId: this.resourceId,
      customerName: v.customerName,
      customerEmail: v.customerEmail,
      notes: v.notes || undefined,
      startTime: slot.start,
      endTime,
    }).subscribe({
      next: booking => { this.submitting.set(false); this.confirmed.set(booking); },
      error: err => {
        this.submitting.set(false);
        this.submitError.set(errorMessage(err));
        this.loadSlots(); // someone may have just taken it
      },
    });
  }

  bookAnother(): void {
    this.confirmed.set(null);
    this.form.controls.notes.reset();
    this.loadSlots();
  }
}
