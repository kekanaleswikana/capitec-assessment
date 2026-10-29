# Capitec Boardroom Booking — Angular + Spring Boot booking system

A runnable starter for booking rooms, desks or appointments.

| Part      | Tech                                                     | Port (host) |
|-----------|----------------------------------------------------------|-------------|
| Frontend  | Angular 18 (standalone components, signals), Nginx       | 8081        |
| Backend   | Spring Boot 3.3, Java 21, Spring Data JPA, Flyway        | 8080        |
| Database  | PostgreSQL 16                                            | 5432        |
| Mail      | Mailpit (catches reminder emails for local dev)          | 8025 (UI), 1025 (SMTP) |

## Run everything with Docker

Requires Docker Desktop (or Docker Engine with Compose v2).

```bash
docker compose up --build
```

First build takes a few minutes (Maven and npm download dependencies). Then open:

- App: http://localhost:8081
- Swagger UI: http://localhost:8080/swagger-ui.html
- Health: http://localhost:8080/actuator/health
- Mailpit (reminder emails): http://localhost:8025

Four sample spaces are seeded on first start. Stop with `Ctrl+C`; wipe the database with `docker compose down -v`.

## Run locally without Docker (for development)

```bash
# 1. Database only
docker compose up -d db

# 2. Backend (Java 21 + Maven)
cd backend
mvn spring-boot:run

# 3. Frontend (Node 20+) — ng serve proxies /api to localhost:8080
cd frontend
npm install
npm start          # http://localhost:4200
```

## API

| Method | Path                                          | Purpose                                 |
|--------|-----------------------------------------------|-----------------------------------------|
| GET    | `/api/resources`                              | List bookable spaces                    |
| GET    | `/api/resources/{id}`                         | One space                               |
| POST   | `/api/resources`                              | Create a space                          |
| GET    | `/api/resources/{id}/availability?date=YYYY-MM-DD` | Slots for a day, with `available` flag |
| POST   | `/api/bookings`                               | Book a slot                             |
| GET    | `/api/bookings?email=you@example.com`         | A customer's own bookings (`email` required — `400` without it) |
| GET    | `/api/bookings/{id}`                          | One booking                             |
| PATCH  | `/api/bookings/{id}/cancel`                   | Cancel a booking                        |
| POST   | `/api/auth/login`                             | Admin sign-in (sets a session cookie)   |
| POST   | `/api/auth/logout`                            | Admin sign-out                          |
| GET    | `/api/auth/me`                                | Current admin, or `401`                 |
| GET    | `/api/admin/bookings` (admin)                 | Every booking, any customer             |
| PUT    | `/api/admin/bookings/{id}` (admin)            | Full edit: resource, time, customer, status |

`(admin)` routes require an authenticated admin session (see below).

Example:

```bash
curl -X POST http://localhost:8080/api/bookings \
  -H 'Content-Type: application/json' \
  -d '{"resourceId":1,"customerName":"Thandi","customerEmail":"thandi@example.com",
       "startTime":"2026-10-26T09:00:00","endTime":"2026-10-26T10:00:00"}'
```

Errors come back as RFC 7807 problem JSON, e.g. `409` with `"detail": "That time slot is already booked"`.

## Reminder emails

A scheduled job (`BookingReminderScheduler`) polls every `app.reminders.poll-interval-ms` (default 60s)
for confirmed bookings starting within `app.reminders.lead-minutes` (default 15) and emails the customer
once via Spring Mail. A `reminder_sent` flag on the booking stops it from firing twice; if the send fails
(e.g. SMTP is down), the flag is left unset so the next poll retries it.

In Docker, mail goes to the bundled **Mailpit** container — open http://localhost:8025 to see reminder
emails without configuring real SMTP. Point `MAIL_HOST`/`MAIL_PORT` at a real server for production.

## Admin access

Open http://localhost:8081/admin/login. A single admin account is seeded on first boot from
`ADMIN_USERNAME`/`ADMIN_PASSWORD` (set in `docker-compose.yml` for local dev — **change these outside
local dev**). The account lives in the `admin_users` table (hashed with BCrypt), not in config.

Auth is a plain session cookie (`server.servlet.session.cookie.same-site: lax`), since the app is always
served same-origin (Nginx/`ng serve` proxy `/api` — see `WebConfig`'s CORS comment) — no token handling
needed on the Angular side. CSRF protection is disabled on the Spring Security chain: `SameSite=Lax`
already stops the cookie being sent on a cross-site POST/XHR, and the CORS allow-list only ever permits
the app's own origins, which together cover the CSRF-relevant attack vector for a single-admin tool.

From `/admin`, an admin can see every booking (not just one customer's) and edit a booking's resource,
time, customer details and status.

## How double bookings are prevented

1. The service checks for an overlapping confirmed booking and returns `409` with a friendly message.
2. PostgreSQL enforces an **exclusion constraint** (`no_overlapping_bookings` in `V1__init_schema.sql`), so even two simultaneous requests can't both succeed. The losing request is turned into a `409`.
3. `@Version` optimistic locking protects updates such as cancellations.

## Project layout

```
booking-system/
├── docker-compose.yml
├── backend/
│   ├── Dockerfile                      multi-stage: Maven build → JRE runtime
│   ├── pom.xml
│   └── src/main/
│       ├── java/com/capitec/booking/
│       │   ├── resource/               Resource entity, availability, /api/resources
│       │   ├── booking/                Booking entity, rules, /api/bookings, reminder scheduler + mailer
│       │   ├── admin/                  admin_users, login/logout, admin-only booking endpoints
│       │   ├── common/                 exceptions + global error handler
│       │   └── config/                 CORS, Clock, scheduling, Spring Security
│       └── resources/
│           ├── application.yml
│           └── db/migration/           Flyway SQL (schema + seed data)
└── frontend/
    ├── Dockerfile                      multi-stage: Node build → Nginx
    ├── nginx.conf                      serves the SPA and proxies /api → backend
    ├── proxy.conf.json                 dev proxy for ng serve
    └── src/app/
        ├── core/                       API service, models, date helpers, auth service/guard/interceptor
        └── features/                   resources list, booking page, my bookings, admin login + dashboard
```

## Next steps

- **Customer auth:** derive the customer from a real login (e.g. Keycloak + JWT) instead of an email field — admin login already exists (see above).
- **Notifications:** confirmation emails via Spring Mail (reminders are already done — see above), later through RabbitMQ.
- **Slot holds:** Redis with a TTL while the user fills in the form.
- **Tests:** JUnit 5 + Testcontainers (real PostgreSQL) for the booking rules.
