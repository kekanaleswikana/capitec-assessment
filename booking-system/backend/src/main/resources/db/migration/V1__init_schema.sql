-- Needed so the exclusion constraint can combine "=" on resource_id with "&&" on a time range
CREATE EXTENSION IF NOT EXISTS btree_gist;

CREATE TABLE resources (
    id            BIGSERIAL PRIMARY KEY,
    name          VARCHAR(120) NOT NULL,
    description   TEXT,
    location      VARCHAR(120),
    capacity      INT          NOT NULL DEFAULT 1,
    open_time     TIME         NOT NULL DEFAULT '08:00',
    close_time    TIME         NOT NULL DEFAULT '18:00',
    slot_minutes  INT          NOT NULL DEFAULT 60,
    CONSTRAINT chk_resource_hours CHECK (close_time > open_time),
    CONSTRAINT chk_resource_slot  CHECK (slot_minutes BETWEEN 5 AND 480)
);

CREATE TABLE bookings (
    id              BIGSERIAL PRIMARY KEY,
    resource_id     BIGINT       NOT NULL REFERENCES resources (id),
    customer_name   VARCHAR(120) NOT NULL,
    customer_email  VARCHAR(200) NOT NULL,
    notes           VARCHAR(500),
    start_time      TIMESTAMP    NOT NULL,
    end_time        TIMESTAMP    NOT NULL,
    status          VARCHAR(20)  NOT NULL DEFAULT 'CONFIRMED',
    created_at      TIMESTAMP    NOT NULL DEFAULT now(),
    version         BIGINT       NOT NULL DEFAULT 0,
    CONSTRAINT chk_booking_time CHECK (end_time > start_time),
    -- The database itself refuses two confirmed bookings that overlap on the same resource.
    -- This is the last line of defence against double bookings, even under concurrent requests.
    CONSTRAINT no_overlapping_bookings EXCLUDE USING gist (
        resource_id WITH =,
        tsrange(start_time, end_time, '[)') WITH &&
    ) WHERE (status = 'CONFIRMED')
);

CREATE INDEX idx_bookings_resource_start ON bookings (resource_id, start_time);
CREATE INDEX idx_bookings_email ON bookings (lower(customer_email));
