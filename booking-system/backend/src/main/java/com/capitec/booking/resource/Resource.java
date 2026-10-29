package com.capitec.booking.resource;

import jakarta.persistence.*;

import java.time.LocalTime;

/** Something that can be booked: a room, a desk, a consultant, a court... */
@Entity
@Table(name = "resources")
public class Resource {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 120)
    private String name;

    private String description;

    @Column(length = 120)
    private String location;

    @Column(nullable = false)
    private int capacity = 1;

    @Column(name = "open_time", nullable = false)
    private LocalTime openTime = LocalTime.of(8, 0);

    @Column(name = "close_time", nullable = false)
    private LocalTime closeTime = LocalTime.of(18, 0);

    @Column(name = "slot_minutes", nullable = false)
    private int slotMinutes = 60;

    protected Resource() {
    }

    public Resource(String name, String description, String location, int capacity,
                    LocalTime openTime, LocalTime closeTime, int slotMinutes) {
        this.name = name;
        this.description = description;
        this.location = location;
        this.capacity = capacity;
        this.openTime = openTime;
        this.closeTime = closeTime;
        this.slotMinutes = slotMinutes;
    }

    public Long getId() { return id; }
    public String getName() { return name; }
    public String getDescription() { return description; }
    public String getLocation() { return location; }
    public int getCapacity() { return capacity; }
    public LocalTime getOpenTime() { return openTime; }
    public LocalTime getCloseTime() { return closeTime; }
    public int getSlotMinutes() { return slotMinutes; }
}
