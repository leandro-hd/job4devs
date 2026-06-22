# 03 — Database Schema

## Design Principles

- **Global layer:** `sources`, `jobs`, `alert_logs` — no `user_id`. Shared across all users.
- **User layer:** `users`, `user_settings`, `notifications` — isolated per user.
- **Deduplication is a database concern**, not an application concern. Always use `ON CONFLICT DO NOTHING`.
- All timestamps use `TIMESTAMPTZ` (timezone-aware).
- No soft deletes in the MVP. Hard deletes with `ON DELETE CASCADE` where appropriate.

---

## ERD (Text)

```
users ──1:N──► user_settings
users ──1:N──► notifications ◄──N:1── jobs ──N:1── sources
sources ──1:N──► alert_logs
```

---

## Full DDL

```sql
-- ============================================================
-- SOURCES
-- ============================================================
CREATE TABLE sources (
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(100)  NOT NULL UNIQUE,
    base_url    VARCHAR(500)  NOT NULL,
    active      BOOLEAN       NOT NULL DEFAULT true,
    created_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- ============================================================
-- USERS
-- ============================================================
CREATE TABLE users (
    id              SERIAL PRIMARY KEY,
    email           VARCHAR(255)  NOT NULL UNIQUE,
    password_hash   VARCHAR(255)  NOT NULL,
    name            VARCHAR(255)  NOT NULL,
    active          BOOLEAN       NOT NULL DEFAULT true,
    created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- ============================================================
-- USER_SETTINGS
-- Key/value store scoped per user.
-- Keys used in MVP: keywords, min_budget, notification_email
-- cron_interval_minutes is NOT a per-user setting — there is a single global
-- node-cron schedule, read from DEFAULT_CRON_INTERVAL_MINUTES (.env).
-- ============================================================
CREATE TABLE user_settings (
    id          SERIAL PRIMARY KEY,
    user_id     INTEGER       NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    key         VARCHAR(100)  NOT NULL,
    value       TEXT          NOT NULL,
    updated_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_user_settings UNIQUE (user_id, key)
);

-- ============================================================
-- JOBS
-- Global. Not owned by any user.
-- ============================================================
CREATE TABLE jobs (
    id              SERIAL PRIMARY KEY,
    source_id       INTEGER       NOT NULL REFERENCES sources(id) ON DELETE RESTRICT,
    external_id     VARCHAR(255)  NOT NULL,
    title           VARCHAR(500)  NOT NULL,
    url             VARCHAR(1000) NOT NULL,
    description     TEXT,
    budget_min      NUMERIC(12,2),
    budget_max      NUMERIC(12,2),
    budget_type     VARCHAR(50),
    -- budget_type values: 'fixed' | 'hourly' | 'unspecified'
    client_rating   NUMERIC(3,2),
    -- range: 0.00 to 5.00
    client_reviews  INTEGER,
    location        VARCHAR(255),
    raw_tags        TEXT[],
    published_at    TIMESTAMPTZ,
    scraped_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_jobs_source_external UNIQUE (source_id, external_id),
    CONSTRAINT chk_budget_range CHECK (
        budget_min IS NULL OR budget_max IS NULL OR budget_min <= budget_max
    ),
    CONSTRAINT chk_client_rating CHECK (
        client_rating IS NULL OR (client_rating >= 0 AND client_rating <= 5)
    )
);

-- ============================================================
-- NOTIFICATIONS
-- One row per (user, job) pair. Prevents duplicate notifications.
-- ============================================================
CREATE TABLE notifications (
    id              SERIAL PRIMARY KEY,
    user_id         INTEGER       NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    job_id          INTEGER       NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    channel         VARCHAR(50)   NOT NULL DEFAULT 'email',
    -- channel values: 'email' (only in MVP)
    recipient       VARCHAR(255)  NOT NULL,
    status          VARCHAR(50)   NOT NULL DEFAULT 'pending',
    -- status values: 'pending' | 'sent' | 'failed'
    error_message   TEXT,
    sent_at         TIMESTAMPTZ,
    created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_notification_user_job UNIQUE (user_id, job_id),
    CONSTRAINT chk_notification_status
        CHECK (status IN ('pending', 'sent', 'failed'))
);

-- ============================================================
-- ALERT_LOGS
-- One row per worker execution cycle, per source.
-- ============================================================
CREATE TABLE alert_logs (
    id              SERIAL PRIMARY KEY,
    source_id       INTEGER     REFERENCES sources(id) ON DELETE SET NULL,
    executed_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    jobs_found      INTEGER     NOT NULL DEFAULT 0,
    jobs_new        INTEGER     NOT NULL DEFAULT 0,
    jobs_notified   INTEGER     NOT NULL DEFAULT 0,
    status          VARCHAR(50) NOT NULL DEFAULT 'success',
    -- status values: 'success' | 'partial' | 'failed'
    error_message   TEXT,
    duration_ms     INTEGER,

    CONSTRAINT chk_alert_log_status
        CHECK (status IN ('success', 'partial', 'failed'))
);
```

---

## Indexes

```sql
-- Deduplication — called on every scraper cycle
CREATE UNIQUE INDEX idx_jobs_dedup
    ON jobs (source_id, external_id);

-- Feed ordering
CREATE INDEX idx_jobs_published_at
    ON jobs (published_at DESC);

-- Filter by source in dashboard
CREATE INDEX idx_jobs_source_id
    ON jobs (source_id);

-- Worker: find pending notifications to send
CREATE INDEX idx_notifications_pending
    ON notifications (status)
    WHERE status = 'pending';

-- User's notification history
CREATE INDEX idx_notifications_user_id
    ON notifications (user_id);

-- Deduplication check: has this user been notified for this job?
CREATE INDEX idx_notifications_user_job
    ON notifications (user_id, job_id);

-- Settings lookup per user (called every worker cycle)
CREATE INDEX idx_user_settings_user_id
    ON user_settings (user_id);

-- Dashboard: recent logs
CREATE INDEX idx_alert_logs_executed_at
    ON alert_logs (executed_at DESC);
```

---

## Seed Data

```sql
INSERT INTO sources (name, base_url) VALUES
    ('99freelas', 'https://www.99freelas.com.br');
```

---

## Key Patterns

### Insert or ignore (deduplication)
```sql
-- Jobs
INSERT INTO jobs (source_id, external_id, title, url, ...)
VALUES ($1, $2, $3, $4, ...)
ON CONFLICT (source_id, external_id) DO NOTHING;

-- Notifications
INSERT INTO notifications (user_id, job_id, channel, recipient)
VALUES ($1, $2, $3, $4)
ON CONFLICT (user_id, job_id) DO NOTHING;
```

### Find jobs not yet seen by a specific user
```sql
SELECT j.*
FROM jobs j
WHERE j.scraped_at > NOW() - INTERVAL '1 hour'
  AND NOT EXISTS (
      SELECT 1 FROM notifications n
      WHERE n.job_id = j.id
        AND n.user_id = $1
  );
```

### Find pending notifications for a user
```sql
SELECT n.*, j.title, j.url, j.budget_min, j.budget_max, j.published_at
FROM notifications n
JOIN jobs j ON j.id = n.job_id
WHERE n.user_id = $1
  AND n.status = 'pending';
```
