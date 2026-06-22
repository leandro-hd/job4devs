-- Global. Not owned by any user.
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

-- Deduplication — called on every scraper cycle
CREATE UNIQUE INDEX idx_jobs_dedup
    ON jobs (source_id, external_id);

-- Feed ordering
CREATE INDEX idx_jobs_published_at
    ON jobs (published_at DESC);

-- Filter by source in dashboard
CREATE INDEX idx_jobs_source_id
    ON jobs (source_id);
