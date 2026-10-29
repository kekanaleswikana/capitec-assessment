package com.capitec.booking.resource;

import com.capitec.booking.booking.domain.Booking;
import com.capitec.booking.booking.repository.BookingRepository;
import com.capitec.booking.common.NotFoundException;
import com.capitec.booking.resource.ResourceDtos.CreateResourceRequest;
import com.capitec.booking.resource.ResourceDtos.SlotResponse;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
@Transactional(readOnly = true)
public class ResourceService {

    private final ResourceRepository resources;
    private final BookingRepository bookings;
    private final Clock clock;

    public ResourceService(ResourceRepository resources, BookingRepository bookings, Clock clock) {
        this.resources = resources;
        this.bookings = bookings;
        this.clock = clock;
    }

    public List<Resource> findAll() {
        return resources.findAllByOrderByNameAsc();
    }

    public Resource get(Long id) {
        return resources.findById(id)
                .orElseThrow(() -> new NotFoundException("Resource " + id + " not found"));
    }

    @Transactional
    public Resource create(CreateResourceRequest req) {
        if (!req.closeTime().isAfter(req.openTime())) {
            throw new IllegalArgumentException("closeTime must be after openTime");
        }
        return resources.save(new Resource(req.name(), req.description(), req.location(), req.capacity(),
                req.openTime(), req.closeTime(), req.slotMinutes()));
    }

    /** Splits the resource's opening hours on a given day into slots and marks which are free. */
    public List<SlotResponse> availability(Long resourceId, LocalDate date) {
        Resource resource = get(resourceId);
        LocalDateTime dayStart = date.atTime(resource.getOpenTime());
        LocalDateTime dayEnd = date.atTime(resource.getCloseTime());
        LocalDateTime now = LocalDateTime.now(clock);

        List<Booking> taken = bookings.findConfirmedInRange(resourceId, dayStart, dayEnd);

        List<SlotResponse> slots = new ArrayList<>();
        LocalDateTime cursor = dayStart;
        while (!cursor.plusMinutes(resource.getSlotMinutes()).isAfter(dayEnd)) {
            LocalDateTime slotStart = cursor;
            LocalDateTime slotEnd = cursor.plusMinutes(resource.getSlotMinutes());
            boolean overlaps = taken.stream()
                    .anyMatch(b -> b.getStartTime().isBefore(slotEnd) && b.getEndTime().isAfter(slotStart));
            boolean inPast = slotStart.isBefore(now);
            slots.add(new SlotResponse(slotStart, slotEnd, !overlaps && !inPast));
            cursor = slotEnd;
        }
        return slots;
    }
}
