package com.capitec.booking.resource;

import com.capitec.booking.resource.ResourceDtos.CreateResourceRequest;
import com.capitec.booking.resource.ResourceDtos.ResourceResponse;
import com.capitec.booking.resource.ResourceDtos.SlotResponse;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/resources")
public class ResourceController {

    private final ResourceService service;

    public ResourceController(ResourceService service) {
        this.service = service;
    }

    @GetMapping
    public List<ResourceResponse> list() {
        return service.findAll().stream().map(ResourceResponse::from).toList();
    }

    @GetMapping("/{id}")
    public ResourceResponse get(@PathVariable Long id) {
        return ResourceResponse.from(service.get(id));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ResourceResponse create(@Valid @RequestBody CreateResourceRequest request) {
        return ResourceResponse.from(service.create(request));
    }

    @GetMapping("/{id}/availability")
    public List<SlotResponse> availability(@PathVariable Long id,
                                           @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return service.availability(id, date);
    }
}
