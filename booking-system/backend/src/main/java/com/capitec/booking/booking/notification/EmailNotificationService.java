package com.capitec.booking.booking.notification;

import com.capitec.booking.booking.domain.Booking;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

import java.time.format.DateTimeFormatter;

@Service
public class EmailNotificationService implements NotificationService {

    private static final Logger log = LoggerFactory.getLogger(EmailNotificationService.class);
    private static final DateTimeFormatter TIME_FORMAT = DateTimeFormatter.ofPattern("EEE d MMM yyyy, HH:mm");

    private final JavaMailSender mailSender;
    private final String from;

    public EmailNotificationService(JavaMailSender mailSender, @Value("${app.reminders.mail-from}") String from) {
        this.mailSender = mailSender;
        this.from = from;
    }

    @Override
    public void sendBookingReminder(Booking booking) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(from);
        message.setTo(booking.getCustomerEmail());
        message.setSubject("Reminder: " + booking.getResource().getName() + " starts soon");
        message.setText("Hi " + booking.getCustomerName() + ",\n\n"
                + "This is a reminder that your booking for \"" + booking.getResource().getName() + "\" "
                + "starts at " + booking.getStartTime().format(TIME_FORMAT) + ".\n\n"
                + "See you soon!");
        mailSender.send(message);
        log.info("Sent booking reminder for booking {} to {}", booking.getId(), booking.getCustomerEmail());
    }

    @Override
    public void sendBookingConfirmation(Booking booking) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(from);
        message.setTo(booking.getCustomerEmail());
        message.setSubject("Booking confirmed: " + booking.getResource().getName());
        message.setText("Hi " + booking.getCustomerName() + ",\n\n"
                + "Your booking is confirmed:\n\n"
                + "  Space: " + booking.getResource().getName() + "\n"
                + "  When: " + booking.getStartTime().format(TIME_FORMAT)
                + " – " + booking.getEndTime().toLocalTime() + "\n"
                + "  Booking #" + booking.getId() + "\n\n"
                + "We'll remind you again shortly before it starts.");
        mailSender.send(message);
        log.info("Sent booking confirmation for booking {} to {}", booking.getId(), booking.getCustomerEmail());
    }
}
