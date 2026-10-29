package com.capitec.booking.booking.repository;

import com.capitec.booking.booking.domain.Booking;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface BookingRepository extends JpaRepository<Booking, Long> {

    @Query("""
            select count(b) > 0 from Booking b
            where b.resource.id = :resourceId
              and b.status = com.capitec.booking.booking.enums.BookingStatus.CONFIRMED
              and b.startTime < :end
              and b.endTime > :start
            """)
    boolean existsOverlapping(@Param("resourceId") Long resourceId,
                              @Param("start") LocalDateTime start,
                              @Param("end") LocalDateTime end);

    @Query("""
            select count(b) > 0 from Booking b
            where b.resource.id = :resourceId
              and b.id <> :excludeId
              and b.status = com.capitec.booking.booking.enums.BookingStatus.CONFIRMED
              and b.startTime < :end
              and b.endTime > :start
            """)
    boolean existsOverlappingExcluding(@Param("resourceId") Long resourceId,
                                       @Param("start") LocalDateTime start,
                                       @Param("end") LocalDateTime end,
                                       @Param("excludeId") Long excludeId);

    @Query("""
            select b from Booking b
            where b.resource.id = :resourceId
              and b.status = com.capitec.booking.booking.enums.BookingStatus.CONFIRMED
              and b.startTime < :to
              and b.endTime > :from
            order by b.startTime
            """)
    List<Booking> findConfirmedInRange(@Param("resourceId") Long resourceId,
                                       @Param("from") LocalDateTime from,
                                       @Param("to") LocalDateTime to);

    @Query("""
            select b from Booking b join fetch b.resource
            where lower(b.customerEmail) = lower(:email)
            order by b.startTime desc
            """)
    List<Booking> findByCustomerEmail(@Param("email") String email);

    @Query("select b from Booking b join fetch b.resource order by b.startTime desc")
    List<Booking> findAllWithResource();

    @Query("""
            select b from Booking b join fetch b.resource
            where b.status = com.capitec.booking.booking.enums.BookingStatus.CONFIRMED
              and b.reminderSent = false
              and b.startTime > :now
              and b.startTime <= :threshold
            """)
    List<Booking> findDueForReminder(@Param("now") LocalDateTime now,
                                     @Param("threshold") LocalDateTime threshold);
}
