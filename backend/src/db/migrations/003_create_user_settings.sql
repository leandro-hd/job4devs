-- Key/value store scoped per user.
-- Keys used in MVP: keywords, min_budget, notification_email, cron_interval_minutes
CREATE TABLE user_settings (
    id          SERIAL PRIMARY KEY,
    user_id     INTEGER       NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    key         VARCHAR(100)  NOT NULL,
    value       TEXT          NOT NULL,
    updated_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_user_settings UNIQUE (user_id, key)
);

-- Settings lookup per user (called every worker cycle)
CREATE INDEX idx_user_settings_user_id
    ON user_settings (user_id);
