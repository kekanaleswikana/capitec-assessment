-- Staff accounts that can log in and manage bookings. Seeded at application
-- startup (see AdminUserSeeder), not here, so the password never sits in a
-- migration file.
CREATE TABLE admin_users (
    id            BIGSERIAL PRIMARY KEY,
    username      VARCHAR(60)  NOT NULL UNIQUE,
    password_hash VARCHAR(100) NOT NULL,
    created_at    TIMESTAMP    NOT NULL DEFAULT now()
);
