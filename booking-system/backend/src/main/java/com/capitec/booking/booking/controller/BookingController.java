package com.capitec.booking.booking.controller;

import com.capitec.booking.booking.domain.BookingDtos.BookingResponse;
import com.capitec.booking.booking.domain.BookingDtos.CreateBookingRequest;
import com.capitec.booking.booking.service.BookingService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/bookings")
public class BookingController {

    private final BookingService service;

    public BookingController(BookingService service) {
        this.service = service;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public BookingResponse create(@Valid @RequestBody CreateBookingRequest request) {
        return BookingResponse.from(service.create(request));
    }

    /** A customer's own bookings. Requires their email — see /api/admin/bookings for the full list. */
    @GetMapping
    public List<BookingResponse> list(@RequestParam(required = false) String email) {
        return service.find(email).stream().map(BookingResponse::from).toList();
    }

    @GetMapping("/{id}")
    @Transactional(readOnly = true)
    public BookingResponse get(@PathVariable Long id) {
        return BookingResponse.from(service.get(id));
    }

    @PatchMapping("/{id}/cancel")
    @Transactional
    public BookingResponse cancel(@PathVariable Long id) {
        return BookingResponse.from(service.cancel(id));
    }
}
