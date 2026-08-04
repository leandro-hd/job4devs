# 01 — MVP Scope

## What the MVP Delivers

**job4devs** — a single end-to-end flow:

1. Worker scrapes job listings from **99freelas** on a configurable interval
2. New jobs are stored (duplicates silently rejected)
3. Each active user's keyword filters are applied
4. Matching jobs trigger an **e-mail notification** per user
5. A **React dashboard** lets users configure keywords, view collected jobs, and monitor system status

---

## In Scope (MVP)

### Backend
- [x] Express API with JWT authentication (register, login)
- [x] 99freelas scraper (Axios + Cheerio, no browser headless)
- [x] node-cron scheduler with configurable interval (read from `user_settings`)
- [x] Per-user keyword filtering service
- [x] E-mail notification via Resend (HTTP API)
- [x] Deduplication enforced via DB constraints (`ON CONFLICT DO NOTHING`)
- [x] `alert_logs` written after every worker cycle
- [x] Failure detection: worker logs `status = 'failed'` and error message on exception

### Frontend
- [x] Auth screens: register, login
- [x] Feed page: paginated list of collected jobs (title, source, budget, published date, link)
- [x] Dashboard: last cycle status, total jobs collected, total notifications sent
- [x] Settings page: manage keywords, minimum budget, notification email

### Database
- Full schema as specified in `docs/03-database.md`
- Migrations in `backend/src/db/migrations/` (plain `.sql` files, run in order)

### Hosting
- Full setup as specified in `docs/05-hosting.md`
- Frontend live at `job4devs.dev`
- API live at `api.job4devs.dev`

---

## Success Criteria

| Criterion | Target |
|---|---|
| End-to-end flow | User receives real job alert emails without manual intervention |
| Deduplication | Same job never notified twice to the same user |
| Stability | Runs 7 consecutive days without crashing |
| Relevance | ≥ 50% of notified jobs match user's filters when checked manually |
| Failure visibility | Worker failure is visible in dashboard — not discovered by absence of emails |
| Live URL | Project accessible at a custom domain with HTTPS |

---

## Phase 2 — Completed

| Feature | Notes |
|---|---|
| GitHub Actions CI + Railway deploy gate | type-check + lint must pass before deploy |
| Exclude keywords | per-user; jobs matching excluded keywords are suppressed |
| Password recovery | token in DB, 1h expiry, transactional email via Resend |
| Separate transactional email sender | `noreply@job4devs.dev` for password reset, `alerts@job4devs.dev` for alerts |
| Unsubscribe link in alert emails | JWT-signed token, no expiry, deactivates user account |
| Account reactivation | Settings page banner + button when `active = false` |
| 99freelas: `proposal_count` + `interested_count` | fetched from public detail page per new job |
| 99freelas: `avg_proposal_value` + `avg_duration_days` | fetched from authenticated bid page per new job |

## Explicitly Deferred (Post-Phase 2)

| Feature | Phase |
|---|---|
| Upwork integration | Phase 3 |
| Additional filters: client rating, budget range, location | Phase 3 |
| Telegram / Slack notifications | Phase 3 |
| Job history search and advanced filtering in UI | Phase 3 |
| NLP-based relevance scoring | Phase 4 |
| Admin panel | Phase 4 |
| Dark mode, advanced animations | Phase 4 |
