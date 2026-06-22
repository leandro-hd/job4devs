-- One row per worker execution cycle, per source.
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

-- Dashboard: recent logs
CREATE INDEX idx_alert_logs_executed_at
    ON alert_logs (executed_at DESC);
