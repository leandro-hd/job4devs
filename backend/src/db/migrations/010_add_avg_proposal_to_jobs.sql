ALTER TABLE jobs
  ADD COLUMN avg_proposal_value NUMERIC(12,2),
  ADD COLUMN avg_duration_days  INTEGER;
