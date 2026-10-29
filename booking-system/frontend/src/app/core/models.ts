export interface Resource {
  id: number;
  name: string;
  description: string | null;
  location: string | null;
  capacity: number;
  openTime: string;   // "08:00:00"
  closeTime: string;
  slotMinutes: number;
}

export interface Slot {
  start: string;      // "2026-10-24T09:00:00" (local time)
  end: string;
  available: boolean;
}

export type BookingStatus = 'CONFIRMED' | 'CANCELLED';

export interface Booking {
  id: number;
  resourceId: number;
  resourceName: string;
  customerName: string;
  customerEmail: string;
  notes: string | null;
  startTime: string;
  endTime: string;
  status: BookingStatus;
  createdAt: string;
  reminderSent: boolean;
}

export interface CreateBookingRequest {
  resourceId: number;
  customerName: string;
  customerEmail: string;
  notes?: string;
  startTime: string;
  endTime: string;
}

/** Full replacement of a booking's details — used by the admin dashboard. */
export interface AdminUpdateBookingRequest {
  resourceId: number;
  customerName: string;
  customerEmail: string;
  notes?: string;
  startTime: string;
  endTime: string;
  status: BookingStatus;
}

export interface AdminUser {
  username: string;
}

export type AuditAction = 'CREATED' | 'UPDATED' | 'CANCELLED';

/** One row of the booking activity trail — who did what, and when. */
export interface AuditEntry {
  id: number;
  bookingId: number;
  action: AuditAction;
  actor: string;
  resourceName: string;
  customerName: string;
  customerEmail: string;
  startTime: string;
  endTime: string;
  details: string | null;
  createdAt: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

/** Shape of Spring's ProblemDetail error responses. */
export interface ApiProblem {
  title?: string;
  status?: number;
  detail?: string;
}
