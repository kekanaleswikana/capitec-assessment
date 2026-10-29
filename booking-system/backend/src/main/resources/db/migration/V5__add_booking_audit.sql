-- Append-only trail of every create/update/cancel on a booking, by whoever did it
-- ("customer" for the public self-service flow, or the admin's username). Columns
-- are a readable snapshot at the time of the event, not a live reference, so the
-- history stays accurate even if the booking itself changes again later.
CREATE TABLE booking_audit (
    id             BIGSERIAL PRIMARY KEY,
    booking_id     BIGINT       NOT NULL,
    action         VARCHAR(20)  NOT NULL,
    actor          VARCHAR(120) NOT NULL,
    resource_name  VARCHAR(120) NOT NULL,
    customer_name  VARCHAR(120) NOT NULL,
    customer_email VARCHAR(200) NOT NULL,
    start_time     TIMESTAMP    NOT NULL,
    end_time       TIMESTAMP    NOT NULL,
    details        VARCHAR(500),
    created_at     TIMESTAMP    NOT NULL DEFAULT now()
);

CREATE INDEX idx_booking_audit_booking_id ON booking_audit (booking_id);
CREATE INDEX idx_booking_audit_created_at ON booking_audit (created_at DESC);
