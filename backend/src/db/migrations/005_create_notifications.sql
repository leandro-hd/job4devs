-- One row per (user, job) pair. Prevents duplicate notifications.
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
