package com.capitec.booking.booking.domain;

import com.capitec.booking.booking.enums.BookingStatus;
import jakarta.validation.constraints.*;

import java.time.LocalDateTime;

public final class BookingDtos {

    private BookingDtos() {
    }

    public record CreateBookingRequest(
            @NotNull Long resourceId,
            @NotBlank @Size(max = 120) String customerName,
            @NotBlank @Email @Size(max = 200) String customerEmail,
            @Size(max = 500) String notes,
            @NotNull LocalDateTime startTime,
            @NotNull LocalDateTime endTime) {
    }

    /** Admin edit: a full replacement of the booking's bookable details, same shape as creation plus status. */
    public record AdminUpdateBookingRequest(
            @NotNull Long resourceId,
            @NotBlank @Size(max = 120) String customerName,
            @NotBlank @Email @Size(max = 200) String customerEmail,
            @Size(max = 500) String notes,
            @NotNull LocalDateTime startTime,
            @NotNull LocalDateTime endTime,
            @NotNull BookingStatus status) {
    }

    public record BookingResponse(Long id, Long resourceId, String resourceName, String customerName,
                                  String customerEmail, String notes, LocalDateTime startTime,
                                  LocalDateTime endTime, BookingStatus status, LocalDateTime createdAt,
                                  boolean reminderSent) {

        public static BookingResponse from(Booking b) {
            return new BookingResponse(b.getId(), b.getResource().getId(), b.getResource().getName(),
                    b.getCustomerName(), b.getCustomerEmail(), b.getNotes(), b.getStartTime(),
                    b.getEndTime(), b.getStatus(), b.getCreatedAt(), b.isReminderSent());
        }
    }
}
