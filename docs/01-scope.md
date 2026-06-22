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
- [ ] Express API with JWT authentication (register, login)
- [ ] 99freelas scraper (Axios + Cheerio, no browser headless)
- [ ] node-cron scheduler with configurable interval (read from `user_settings`)
- [ ] Per-user keyword filtering service
- [ ] E-mail notification via Nodemailer + Gmail SMTP
- [ ] Deduplication enforced via DB constraints (`ON CONFLICT DO NOTHING`)
- [ ] `alert_logs` written after every worker cycle
- [ ] Failure detection: worker logs `status = 'failed'` and error message on exception

### Frontend
- [ ] Auth screens: register, login
- [ ] Feed page: paginated list of collected jobs (title, source, budget, published date, link)
- [ ] Dashboard: last cycle status, total jobs collected, total notifications sent
- [ ] Settings page: manage keywords, minimum budget, notification email, cron interval

### Database
- Full schema as specified in `docs/03-database.md`
- Migrations in `backend/src/db/migrations/` (plain `.sql` files, run in order)

### Hosting
- Full setup as specified in `docs/05-hosting.md`
- Frontend live at `app.job4devs.com`
- API live at `api.job4devs.com`

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

## Explicitly Deferred (Post-MVP)

These features are **forbidden in the MVP**. Do not implement or scaffold them.

| Feature | Phase |
|---|---|
| Upwork API integration | Phase 2 |
| 99freelas scraping with authentication | Phase 2 |
| Additional filters: client rating, budget range, location | Phase 2 |
| Telegram / Slack notifications | Phase 3 |
| Job history search and advanced filtering in UI | Phase 3 |
| NLP-based relevance scoring | Phase 4 |
| Admin panel | Phase 4 |
| Dark mode, advanced animations | Phase 4 |
