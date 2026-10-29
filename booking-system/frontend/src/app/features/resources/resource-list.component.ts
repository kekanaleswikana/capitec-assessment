import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BookingApiService, errorMessage } from '../../core/booking-api.service';
import { Resource } from '../../core/models';

@Component({
  selector: 'app-resource-list',
  standalone: true,
  imports: [RouterLink],
  template: `
    <section class="intro">
      <h1>Book a space</h1>
      <p class="muted">Pick a room or pod, choose a free slot, and you're done.</p>
    </section>

    @if (loading()) {
      <p class="muted">Loading spaces…</p>
    } @else if (error()) {
      <div class="alert error">{{ error() }}</div>
    } @else {
      <div class="grid">
        @for (r of resources(); track r.id) {
          <article class="card resource">
            <div class="resource-head">
              <h2>{{ r.name }}</h2>
              @if (r.location) { <span class="pill">{{ r.location }}</span> }
            </div>
            <p class="muted">{{ r.description }}</p>
            <dl class="facts">
              <div><dt>Hours</dt><dd>{{ r.openTime.slice(0, 5) }}–{{ r.closeTime.slice(0, 5) }}</dd></div>
              <div><dt>Slot</dt><dd>{{ r.slotMinutes }} min</dd></div>
              <div><dt>Seats</dt><dd>{{ r.capacity }}</dd></div>
            </dl>
            <a class="btn primary" [routerLink]="['/book', r.id]">Choose a time</a>
          </article>
        } @empty {
          <p class="muted">No spaces yet. Add one with POST /api/resources.</p>
        }
      </div>
    }
  `,
})
export class ResourceListComponent implements OnInit {
  private readonly api = inject(BookingApiService);

  readonly resources = signal<Resource[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  ngOnInit(): void {
    this.api.getResources().subscribe({
      next: list => { this.resources.set(list); this.loading.set(false); },
      error: err => { this.error.set(errorMessage(err)); this.loading.set(false); },
    });
  }
}
