package com.capitec.booking.booking.notification;

import com.capitec.booking.booking.domain.Booking;

public interface NotificationService {

    /** Throws if the notification could not be sent, so the caller can decide whether to retry. */
    void sendBookingReminder(Booking booking);

    /** Throws if the notification could not be sent; callers treat this as best-effort and shouldn't fail the booking over it. */
    void sendBookingConfirmation(Booking booking);
}
