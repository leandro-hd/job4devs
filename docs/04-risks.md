# 04 — Technical Risks & Automation Strategy

## Scraping: 99freelas

### Why Axios + Cheerio (not Puppeteer)

99freelas renders job listings server-side. A full browser (Puppeteer/Playwright)
is unnecessary for the MVP and adds significant overhead. Use Axios for HTTP and
Cheerio for HTML parsing. Escalate to a headless browser only if the site moves
to client-side rendering.

### Request hygiene (implement from day one)

```ts
// freelas99.scraper.ts — required headers
const headers: Record<string, string> = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  'Accept-Language': 'pt-BR,pt;q=0.9',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Referer': 'https://www.99freelas.com.br',
};

// Always add a random delay between paginated requests
const delay = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms));
await delay(1500 + Math.random() * 1000); // 1.5–2.5s
```

### Pagination strategy

Scrape page by page. Stop condition: when all jobs on a page already exist in
the DB (all `ON CONFLICT DO NOTHING` resulted in no inserts). This avoids
re-scraping the entire history on every cycle.

### Failure handling (mandatory)

The scraper **must not throw unhandled exceptions to the scheduler.**
Wrap every scraper in try/catch. On failure:
1. Log `status = 'failed'` and `error_message` to `alert_logs`
2. Return an empty array to the orchestrator
3. Continue the worker cycle for other users (partial success)

```ts
// scrape.job.ts pattern
try {
  jobs = await scraperService.run('99freelas');
} catch (err) {
  const message = err instanceof Error ? err.message : String(err);
  await logsRepository.insert({ source_id: 1, status: 'failed', error_message: message });
  return; // do not crash the scheduler
}
```

### Layout change detection

Scrapers must validate that their CSS selectors return non-empty results.
If a scrape returns 0 jobs on a page that should have listings, log it as
`status = 'partial'` with an explicit message: `"Selector returned 0 results — possible layout change"`.
This is visible in the dashboard immediately.

---

## Worker: Scheduling

```ts
// scheduler.ts
import cron from 'node-cron';
import { runScrapeJob } from './jobs/scrape.job';
import * as settingsRepository from '../db/repositories/settings.repository';

export async function startScheduler(): Promise<void> {
  // Read interval from DB — default 5 min if not set
  const interval = await settingsRepository.getGlobal('cron_interval_minutes') ?? 5;
  const expression = `*/${interval} * * * *`;

  cron.schedule(expression, async () => {
    await runScrapeJob();
  });

  console.log(`[Scheduler] Worker running every ${interval} minutes`);
}
```

**Note:** Changing the interval in `user_settings` does not hot-reload the cron.
In the MVP, a restart is required. Hot-reload is a post-MVP improvement.

---

## Authentication

- Passwords hashed with **bcrypt** (minimum 10 rounds).
- JWT signed with `JWT_SECRET` from environment. Never from DB.
- Token expiry: `JWT_EXPIRES_IN` (default `7d`).
- All `/api/*` routes except `/api/auth/register` and `/api/auth/login` require a valid JWT.
- JWT stored in **memory only** on the frontend (React context). No localStorage.
- On app mount, call `GET /api/auth/me` to restore session from a valid token in the
  Authorization header (token must be persisted by the client layer if needed across tabs).

---

## Email Notifications

```ts
// notification.service.ts pattern
const transporter = nodemailer.createTransport({
  host: config.smtp.host,
  port: config.smtp.port,
  auth: { user: config.smtp.user, pass: config.smtp.pass },
});

// One email per user per cycle — batch jobs into a single message
// Do NOT send one email per job. Users will unsubscribe immediately.
async function sendAlert(user: User, jobs: Job[]): Promise<void> {
  await transporter.sendMail({
    from: config.smtp.user,
    to: user.notificationEmail,
    subject: `[Job Alert] ${jobs.length} new job(s) found`,
    html: buildEmailTemplate(jobs),
  });
}
```

**Batch per cycle, not per job.** One email with N jobs per execution cycle.

---

## Known Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| 99freelas blocks scraper IP | Medium | High | Respect rate limits, use delays, add User-Agent headers |
| 99freelas changes HTML layout | High (over time) | Medium | Selector validation + dashboard alert on 0 results |
| Gmail SMTP rate limit | Low | Medium | MVP sends max 1 email/user/cycle — well within limits |
| Cron overlap (cycle takes longer than interval) | Low | Medium | Use a lock flag in memory to skip if previous cycle still running |
| JWT secret exposed | Low | Critical | Never log JWT secret, keep in `.env` only, rotate if leaked |

### Cron overlap guard (implement from day one)

```ts
// scrape.job.ts
let isRunning = false;

export async function runScrapeJob(): Promise<void> {
  if (isRunning) {
    console.warn('[Worker] Previous cycle still running — skipping');
    return;
  }
  isRunning = true;
  try {
    // ... full cycle
  } finally {
    isRunning = false;
  }
}
```

---

## What NOT to Build in the MVP

| Temptation | Why it's a trap |
|---|---|
| Puppeteer/Playwright for 99freelas | Overkill — site is server-rendered. Adds 300MB+ dependency |
| Job queue (Bull/BullMQ) | Not needed for single-source MVP. Add when multi-source causes timing issues |
| Redis for caching | No cache requirement exists in the MVP |
| WebSockets for real-time dashboard | Polling every 30s is sufficient and far simpler |
| Multiple cron schedules per user | One global cron, per-user filtering. Separate schedules don't scale |
