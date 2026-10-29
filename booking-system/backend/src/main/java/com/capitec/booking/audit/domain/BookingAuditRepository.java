package com.capitec.booking.audit.domain;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface BookingAuditRepository extends JpaRepository<BookingAuditEntry, Long> {

    List<BookingAuditEntry> findAllByOrderByCreatedAtDesc();
}
