package com.capitec.booking.admin;

import com.capitec.booking.booking.domain.BookingDtos.AdminUpdateBookingRequest;
import com.capitec.booking.booking.domain.BookingDtos.BookingResponse;
import com.capitec.booking.booking.service.BookingService;
import jakarta.validation.Valid;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/** Admin-only: see and edit every booking, not just the caller's own. Guarded by SecurityConfig (ROLE_ADMIN). */
@RestController
@RequestMapping("/api/admin/bookings")
public class AdminBookingController {

    private final BookingService service;

    public AdminBookingController(BookingService service) {
        this.service = service;
    }

    @GetMapping
    public List<BookingResponse> list() {
        return service.findAll().stream().map(BookingResponse::from).toList();
    }

    @PutMapping("/{id}")
    public BookingResponse update(@PathVariable Long id, @Valid @RequestBody AdminUpdateBookingRequest request,
                                  Authentication authentication) {
        return BookingResponse.from(service.adminUpdate(id, request, authentication.getName()));
    }
}
