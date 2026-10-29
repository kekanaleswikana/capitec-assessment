package com.capitec.booking.booking.domain;

import com.capitec.booking.booking.enums.BookingStatus;
import com.capitec.booking.resource.Resource;
import jakarta.persistence.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "bookings")
public class Booking {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "resource_id", nullable = false)
    private Resource resource;

    @Column(name = "customer_name", nullable = false, length = 120)
    private String customerName;

    @Column(name = "customer_email", nullable = false, length = 200)
    private String customerEmail;

    @Column(length = 500)
    private String notes;

    @Column(name = "start_time", nullable = false)
    private LocalDateTime startTime;

    @Column(name = "end_time", nullable = false)
    private LocalDateTime endTime;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private BookingStatus status = BookingStatus.CONFIRMED;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "reminder_sent", nullable = false)
    private boolean reminderSent = false;

    /** Optimistic locking: two people editing the same booking can't silently overwrite each other. */
    @Version
    private long version;

    protected Booking() {
    }

    public Booking(Resource resource, String customerName, String customerEmail, String notes,
                   LocalDateTime startTime, LocalDateTime endTime, LocalDateTime createdAt) {
        this.resource = resource;
        this.customerName = customerName;
        this.customerEmail = customerEmail;
        this.notes = notes;
        this.startTime = startTime;
        this.endTime = endTime;
        this.createdAt = createdAt;
    }

    public void cancel() {
        this.status = BookingStatus.CANCELLED;
    }

    public void markReminderSent() {
        this.reminderSent = true;
    }

    /** Admin edit: full replacement of the bookable details. Resets reminderSent since the old flag no longer applies to the new time. */
    public void reschedule(Resource resource, String customerName, String customerEmail, String notes,
                           LocalDateTime startTime, LocalDateTime endTime) {
        this.resource = resource;
        this.customerName = customerName;
        this.customerEmail = customerEmail;
        this.notes = notes;
        this.startTime = startTime;
        this.endTime = endTime;
        this.reminderSent = false;
    }

    public void markStatus(BookingStatus status) {
        this.status = status;
    }

    public Long getId() { return id; }
    public Resource getResource() { return resource; }
    public String getCustomerName() { return customerName; }
    public String getCustomerEmail() { return customerEmail; }
    public String getNotes() { return notes; }
    public LocalDateTime getStartTime() { return startTime; }
    public LocalDateTime getEndTime() { return endTime; }
    public BookingStatus getStatus() { return status; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public boolean isReminderSent() { return reminderSent; }
}
