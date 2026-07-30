ALTER TABLE users
  ADD COLUMN reset_token             text,
  ADD COLUMN reset_token_expires_at  timestamptz;
