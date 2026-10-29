package com.capitec.booking.audit;

import com.capitec.booking.audit.domain.AuditAction;
import com.capitec.booking.audit.domain.BookingAuditEntry;
import com.capitec.booking.audit.domain.BookingAuditRepository;
import com.capitec.booking.booking.domain.Booking;
import org.springframework.stereotype.Service;

import java.time.Clock;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class BookingAuditService {

    private final BookingAuditRepository entries;
    private final Clock clock;

    public BookingAuditService(BookingAuditRepository entries, Clock clock) {
        this.entries = entries;
        this.clock = clock;
    }

    public void record(Booking booking, AuditAction action, String actor, String details) {
        entries.save(new BookingAuditEntry(booking.getId(), action, actor, booking.getResource().getName(),
                booking.getCustomerName(), booking.getCustomerEmail(), booking.getStartTime(), booking.getEndTime(),
                details, LocalDateTime.now(clock)));
    }

    public List<BookingAuditEntry> findAll() {
        return entries.findAllByOrderByCreatedAtDesc();
    }
}
