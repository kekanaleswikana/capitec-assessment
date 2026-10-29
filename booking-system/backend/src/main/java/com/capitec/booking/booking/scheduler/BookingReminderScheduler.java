package com.capitec.booking.booking.scheduler;

import com.capitec.booking.booking.domain.Booking;
import com.capitec.booking.booking.notification.NotificationService;
import com.capitec.booking.booking.repository.BookingRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.LocalDateTime;
import java.util.List;

@Component
public class BookingReminderScheduler {

    private static final Logger log = LoggerFactory.getLogger(BookingReminderScheduler.class);

    private final BookingRepository bookings;
    private final NotificationService notifier;
    private final Clock clock;
    private final long leadMinutes;

    public BookingReminderScheduler(BookingRepository bookings, NotificationService notifier, Clock clock,
                                    @Value("${app.reminders.lead-minutes}") long leadMinutes) {
        this.bookings = bookings;
        this.notifier = notifier;
        this.clock = clock;
        this.leadMinutes = leadMinutes;
    }

    /** Runs frequently so a booking starting in exactly 15 minutes is never missed between polls. */
    @Scheduled(fixedRateString = "${app.reminders.poll-interval-ms}")
    @Transactional
    public void sendDueReminders() {
        LocalDateTime now = LocalDateTime.now(clock);
        LocalDateTime threshold = now.plusMinutes(leadMinutes);
        List<Booking> due = bookings.findDueForReminder(now, threshold);
        for (Booking booking : due) {
            try {
                notifier.sendBookingReminder(booking);
                booking.markReminderSent();
            } catch (Exception e) {
                // Left unmarked: the next poll retries it rather than silently dropping the reminder.
                log.warn("Reminder send failed for booking {}, will retry next poll: {}",
                        booking.getId(), e.getMessage());
            }
        }
    }
}
