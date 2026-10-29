import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiProblem, Booking, CreateBookingRequest, Resource, Slot } from './models';

/**
 * All calls use a relative /api path. In Docker, Nginx proxies /api to the Spring container;
 * with "ng serve", proxy.conf.json forwards it to localhost:8080.
 */
@Injectable({ providedIn: 'root' })
export class BookingApiService {
  private readonly http = inject(HttpClient);
  private readonly base = '/api';

  getResources(): Observable<Resource[]> {
    return this.http.get<Resource[]>(`${this.base}/resources`);
  }

  getResource(id: number): Observable<Resource> {
    return this.http.get<Resource>(`${this.base}/resources/${id}`);
  }

  getAvailability(resourceId: number, date: string): Observable<Slot[]> {
    const params = new HttpParams().set('date', date);
    return this.http.get<Slot[]>(`${this.base}/resources/${resourceId}/availability`, { params });
  }

  createBooking(request: CreateBookingRequest): Observable<Booking> {
    return this.http.post<Booking>(`${this.base}/bookings`, request);
  }

  getBookingsByEmail(email: string): Observable<Booking[]> {
    const params = new HttpParams().set('email', email);
    return this.http.get<Booking[]>(`${this.base}/bookings`, { params });
  }

  cancelBooking(id: number): Observable<Booking> {
    return this.http.patch<Booking>(`${this.base}/bookings/${id}/cancel`, {});
  }
}

/** Turns an HTTP error into a sentence worth showing the user. */
export function errorMessage(err: unknown): string {
  if (err instanceof HttpErrorResponse) {
    if (err.status === 0) {
      return 'Can’t reach the booking server. Is the backend running?';
    }
    const problem = err.error as ApiProblem | null;
    return problem?.detail || problem?.title || `Request failed (${err.status})`;
  }
  return 'Something went wrong. Please try again.';
}
