-- Tracks whether the 15-minutes-before reminder has already gone out, so the
-- scheduler never emails the same booking twice.
ALTER TABLE bookings ADD COLUMN reminder_sent BOOLEAN NOT NULL DEFAULT FALSE;
