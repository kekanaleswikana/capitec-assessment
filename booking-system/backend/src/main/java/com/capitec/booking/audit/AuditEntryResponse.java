package com.capitec.booking.audit;

import com.capitec.booking.audit.domain.AuditAction;
import com.capitec.booking.audit.domain.BookingAuditEntry;

import java.time.LocalDateTime;

public record AuditEntryResponse(Long id, Long bookingId, AuditAction action, String actor, String resourceName,
                                 String customerName, String customerEmail, LocalDateTime startTime,
                                 LocalDateTime endTime, String details, LocalDateTime createdAt) {

    public static AuditEntryResponse from(BookingAuditEntry e) {
        return new AuditEntryResponse(e.getId(), e.getBookingId(), e.getAction(), e.getActor(), e.getResourceName(),
                e.getCustomerName(), e.getCustomerEmail(), e.getStartTime(), e.getEndTime(), e.getDetails(), e.getCreatedAt());
    }
}
