package com.capitec.booking.admin;

import com.capitec.booking.admin.domain.AdminUser;
import com.capitec.booking.admin.domain.AdminUserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.Clock;
import java.time.LocalDateTime;

/** Creates the one admin account on first boot, from env vars, so there's never a password baked into a migration. */
@Component
public class AdminUserSeeder implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(AdminUserSeeder.class);
    private static final String DEFAULT_PASSWORD = "ChangeMe123!";

    private final AdminUserRepository admins;
    private final PasswordEncoder encoder;
    private final Clock clock;
    private final String username;
    private final String password;

    public AdminUserSeeder(AdminUserRepository admins, PasswordEncoder encoder, Clock clock,
                           @Value("${app.admin.username}") String username,
                           @Value("${app.admin.password}") String password) {
        this.admins = admins;
        this.encoder = encoder;
        this.clock = clock;
        this.username = username;
        this.password = password;
    }

    @Override
    public void run(ApplicationArguments args) {
        if (admins.count() > 0) {
            return;
        }
        admins.save(new AdminUser(username, encoder.encode(password), LocalDateTime.now(clock)));
        if (DEFAULT_PASSWORD.equals(password)) {
            log.warn("Seeded admin '{}' with the default dev password — set ADMIN_PASSWORD for anything beyond local dev.", username);
        } else {
            log.info("Seeded admin user '{}'.", username);
        }
    }
}
