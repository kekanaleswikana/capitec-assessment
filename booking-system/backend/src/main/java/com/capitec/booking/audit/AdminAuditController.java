package com.capitec.booking.audit;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/** Admin-only: the full booking activity trail. Guarded by SecurityConfig's /api/admin/** rule. */
@RestController
@RequestMapping("/api/admin/audit")
public class AdminAuditController {

    private final BookingAuditService service;

    public AdminAuditController(BookingAuditService service) {
        this.service = service;
    }

    @GetMapping
    public List<AuditEntryResponse> list() {
        return service.findAll().stream().map(AuditEntryResponse::from).toList();
    }
}
