package com.capitec.booking.booking.service;

import com.capitec.booking.audit.BookingAuditService;
import com.capitec.booking.audit.domain.AuditAction;
import com.capitec.booking.booking.domain.BookingDtos.AdminUpdateBookingRequest;
import com.capitec.booking.booking.domain.BookingDtos.CreateBookingRequest;
import com.capitec.booking.booking.enums.BookingStatus;
import com.capitec.booking.booking.domain.Booking;
import com.capitec.booking.booking.notification.NotificationService;
import com.capitec.booking.booking.repository.BookingRepository;
import com.capitec.booking.common.ConflictException;
import com.capitec.booking.common.NotFoundException;
import com.capitec.booking.resource.Resource;
import com.capitec.booking.resource.ResourceService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
@Transactional(readOnly = true)
public class BookingService {

    private static final Logger log = LoggerFactory.getLogger(BookingService.class);
    private static final String CUSTOMER_ACTOR = "customer";

    private final BookingRepository bookings;
    private final ResourceService resources;
    private final NotificationService notifier;
    private final BookingAuditService audit;
    private final Clock clock;

    public BookingService(BookingRepository bookings, ResourceService resources,
                          NotificationService notifier, BookingAuditService audit, Clock clock) {
        this.bookings = bookings;
        this.resources = resources;
        this.notifier = notifier;
        this.audit = audit;
        this.clock = clock;
    }

    @Transactional
    public Booking create(CreateBookingRequest req) {
        Resource resource = resources.get(req.resourceId());
        LocalDateTime start = req.startTime();
        LocalDateTime end = req.endTime();

        validateWindow(resource, start, end);
        if (start.isBefore(LocalDateTime.now(clock))) {
            throw new IllegalArgumentException("You can't book a time in the past");
        }
        // Friendly early check; the DB exclusion constraint still guards against races.
        if (bookings.existsOverlapping(resource.getId(), start, end)) {
            throw new ConflictException("That time slot is already booked");
        }

        Booking booking = new Booking(resource, req.customerName().trim(), req.customerEmail().trim(),
                req.notes(), start, end, LocalDateTime.now(clock));
        Booking saved = bookings.saveAndFlush(booking);
        audit.record(saved, AuditAction.CREATED, CUSTOMER_ACTOR, null);

        // Best-effort: a slow/broken mail server shouldn't fail an otherwise-valid booking.
        try {
            notifier.sendBookingConfirmation(saved);
        } catch (Exception e) {
            log.warn("Confirmation email failed for booking {}: {}", saved.getId(), e.getMessage());
        }

        return saved;
    }

    public Booking get(Long id) {
        return bookings.findById(id)
                .orElseThrow(() -> new NotFoundException("Booking " + id + " not found"));
    }

    /** Self-service lookup: requires the customer's own email, never returns the whole table. */
    public List<Booking> find(String email) {
        if (email == null || email.isBlank()) {
            throw new IllegalArgumentException("email is required");
        }
        return bookings.findByCustomerEmail(email.trim());
    }

    /** Admin-only: every booking, regardless of customer. */
    public List<Booking> findAll() {
        return bookings.findAllWithResource();
    }

    @Transactional
    public Booking cancel(Long id) {
        Booking booking = get(id);
        if (booking.getStatus() == BookingStatus.CANCELLED) {
            throw new ConflictException("Booking is already cancelled");
        }
        booking.cancel();
        Booking saved = bookings.saveAndFlush(booking);
        audit.record(saved, AuditAction.CANCELLED, CUSTOMER_ACTOR, null);
        return saved;
    }

    /** Admin-only: full replacement of a booking's details, including resource, time and status. */
    @Transactional
    public Booking adminUpdate(Long id, AdminUpdateBookingRequest req, String actor) {
        Booking booking = get(id);
        Resource resource = resources.get(req.resourceId());
        LocalDateTime start = req.startTime();
        LocalDateTime end = req.endTime();

        validateWindow(resource, start, end);
        if (req.status() == BookingStatus.CONFIRMED
                && bookings.existsOverlappingExcluding(resource.getId(), start, end, id)) {
            throw new ConflictException("That time slot is already booked");
        }

        BookingStatus previousStatus = booking.getStatus();
        String newCustomerName = req.customerName().trim();
        String newCustomerEmail = req.customerEmail().trim();
        String changeSummary = describeChanges(booking, resource, newCustomerName, newCustomerEmail,
                start, end, req.status());

        booking.reschedule(resource, newCustomerName, newCustomerEmail, req.notes(), start, end);
        booking.markStatus(req.status());
        Booking saved = bookings.saveAndFlush(booking);

        AuditAction action = (previousStatus != BookingStatus.CANCELLED && req.status() == BookingStatus.CANCELLED)
                ? AuditAction.CANCELLED : AuditAction.UPDATED;
        audit.record(saved, action, actor, changeSummary);

        return saved;
    }

    private String describeChanges(Booking before, Resource newResource, String newCustomerName,
                                   String newCustomerEmail, LocalDateTime newStart, LocalDateTime newEnd,
                                   BookingStatus newStatus) {
        List<String> changes = new ArrayList<>();
        if (!before.getResource().getId().equals(newResource.getId())) {
            changes.add("space: " + before.getResource().getName() + " -> " + newResource.getName());
        }
        if (!before.getStartTime().equals(newStart) || !before.getEndTime().equals(newEnd)) {
            changes.add("time changed");
        }
        if (!before.getCustomerName().equals(newCustomerName) || !before.getCustomerEmail().equals(newCustomerEmail)) {
            changes.add("customer details changed");
        }
        if (before.getStatus() != newStatus) {
            changes.add("status: " + before.getStatus() + " -> " + newStatus);
        }
        return changes.isEmpty() ? "no changes" : String.join("; ", changes);
    }

    private void validateWindow(Resource resource, LocalDateTime start, LocalDateTime end) {
        if (!end.isAfter(start)) {
            throw new IllegalArgumentException("endTime must be after startTime");
        }
        if (!start.toLocalDate().equals(end.toLocalDate())
                || start.toLocalTime().isBefore(resource.getOpenTime())
                || end.toLocalTime().isAfter(resource.getCloseTime())) {
            throw new IllegalArgumentException("Booking must fall within opening hours ("
                    + resource.getOpenTime() + "–" + resource.getCloseTime() + ")");
        }
    }
}
