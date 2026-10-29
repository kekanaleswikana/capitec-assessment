package com.capitec.booking.audit.domain;

import jakarta.persistence.*;

import java.time.LocalDateTime;

/** One row per booking create/update/cancel. Not linked by a foreign key on purpose — this is a
 *  historical record, so it must never be affected by (or block) changes to the booking itself. */
@Entity
@Table(name = "booking_audit")
public class BookingAuditEntry {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "booking_id", nullable = false)
    private Long bookingId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private AuditAction action;

    @Column(nullable = false, length = 120)
    private String actor;

    @Column(name = "resource_name", nullable = false, length = 120)
    private String resourceName;

    @Column(name = "customer_name", nullable = false, length = 120)
    private String customerName;

    @Column(name = "customer_email", nullable = false, length = 200)
    private String customerEmail;

    @Column(name = "start_time", nullable = false)
    private LocalDateTime startTime;

    @Column(name = "end_time", nullable = false)
    private LocalDateTime endTime;

    @Column(length = 500)
    private String details;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    protected BookingAuditEntry() {
    }

    public BookingAuditEntry(Long bookingId, AuditAction action, String actor, String resourceName,
                             String customerName, String customerEmail, LocalDateTime startTime,
                             LocalDateTime endTime, String details, LocalDateTime createdAt) {
        this.bookingId = bookingId;
        this.action = action;
        this.actor = actor;
        this.resourceName = resourceName;
        this.customerName = customerName;
        this.customerEmail = customerEmail;
        this.startTime = startTime;
        this.endTime = endTime;
        this.details = details;
        this.createdAt = createdAt;
    }

    public Long getId() { return id; }
    public Long getBookingId() { return bookingId; }
    public AuditAction getAction() { return action; }
    public String getActor() { return actor; }
    public String getResourceName() { return resourceName; }
    public String getCustomerName() { return customerName; }
    public String getCustomerEmail() { return customerEmail; }
    public LocalDateTime getStartTime() { return startTime; }
    public LocalDateTime getEndTime() { return endTime; }
    public String getDetails() { return details; }
    public LocalDateTime getCreatedAt() { return createdAt; }
}
