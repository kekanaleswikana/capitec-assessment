import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { AdminUpdateBookingRequest, AuditEntry, Booking } from './models';

@Injectable({ providedIn: 'root' })
export class AdminApiService {
  private readonly http = inject(HttpClient);
  private readonly base = '/api/admin/bookings';

  listAllBookings(): Observable<Booking[]> {
    return this.http.get<Booking[]>(this.base);
  }

  updateBooking(id: number, request: AdminUpdateBookingRequest): Observable<Booking> {
    return this.http.put<Booking>(`${this.base}/${id}`, request);
  }

  listAudit(): Observable<AuditEntry[]> {
    return this.http.get<AuditEntry[]>('/api/admin/audit');
  }
}
