package com.capitec.booking.resource;

import jakarta.validation.constraints.*;

import java.time.LocalDateTime;
import java.time.LocalTime;

public final class ResourceDtos {

    private ResourceDtos() {
    }

    public record ResourceResponse(Long id, String name, String description, String location,
                                   int capacity, LocalTime openTime, LocalTime closeTime, int slotMinutes) {

        public static ResourceResponse from(Resource r) {
            return new ResourceResponse(r.getId(), r.getName(), r.getDescription(), r.getLocation(),
                    r.getCapacity(), r.getOpenTime(), r.getCloseTime(), r.getSlotMinutes());
        }
    }

    public record CreateResourceRequest(
            @NotBlank @Size(max = 120) String name,
            @Size(max = 1000) String description,
            @Size(max = 120) String location,
            @Min(1) @Max(1000) int capacity,
            @NotNull LocalTime openTime,
            @NotNull LocalTime closeTime,
            @Min(5) @Max(480) int slotMinutes) {
    }

    public record SlotResponse(LocalDateTime start, LocalDateTime end, boolean available) {
    }
}
