# CLAUDE.md — job4devs: Technical Context

> This file is the entry point for Claude Code. Read this first, then follow the
> references to the companion docs for detailed specifications.

---

## What This Project Is

**job4devs** — a Job Alert System for developers. A web application that scrapes
freelance job listings, matches them against per-user keyword filters, and delivers
e-mail notifications. Built as a **personal tool and portfolio project**.

**Companion docs (read in order):**
- [`docs/01-scope.md`](docs/01-scope.md) — MVP scope, success criteria, deferred features
- [`docs/02-architecture.md`](docs/02-architecture.md) — system architecture, folder structure
- [`docs/03-database.md`](docs/03-database.md) — full schema DDL, indexes, design rationale
- [`docs/04-risks.md`](docs/04-risks.md) — scraping risks, anti-patterns, mitigation strategies
- [`docs/05-hosting.md`](docs/05-hosting.md) — hosting strategy, domains, deployment

---

## Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js |
| Language | TypeScript (strict mode) |
| API framework | Express.js |
| Scheduling | node-cron |
| Scraping | Axios + Cheerio |
| Database | PostgreSQL |
| ORM/Query | pg (node-postgres) — raw SQL via repositories |
| Auth | JWT (email + password) |
| E-mail | Nodemailer + Gmail SMTP |
| Frontend | React + Vite |
| UI | Tailwind CSS + shadcn/ui |
| Frontend hosting | Vercel |
| Backend hosting | Railway (paid — no cold start) |
| Database hosting | Railway PostgreSQL (managed) |
| Domain | job4devs.dev |
| Config | dotenv |

---

## Non-Negotiable Constraints

1. **No ORM.** All SQL lives in `src/db/repositories/`, written as raw, fully-typed queries (explicit return types on every repository function). Services never write queries.
2. **No scraping logic in routes or controllers.** Scrapers live in `src/services/scraper/sources/`.
3. **API and Worker are isolated modules** running in the same process. Never couple them.
4. **Deduplication is enforced at the database level** via UNIQUE constraints — not in application code.
5. **No `process.env` reads outside `src/config/index.ts`.**
6. **Sensitive credentials (SMTP, JWT secret) stay in `.env` only** — never in the `settings` table.

---

## Key Business Rules

- **Scraping is global.** The worker collects jobs once, regardless of how many users exist.
- **Filtering is per-user.** After collection, each user's keywords are applied individually.
- **Deduplication happens at two levels:**
  - `jobs` table: `UNIQUE(source_id, external_id)` — prevents duplicate job ingestion.
  - `notifications` table: `UNIQUE(user_id, job_id)` — prevents notifying the same user twice for the same job.
- **Worker execution flow (strict order):**
  1. Scraper fetches raw jobs from source → `INSERT INTO jobs ON CONFLICT DO NOTHING`
  2. Query for jobs not yet matched to each user
  3. Per user: load keywords from `user_settings`, filter matching jobs
  4. `INSERT INTO notifications ON CONFLICT DO NOTHING` for matched jobs
  5. Process `pending` notifications → send email → `UPDATE status`
  6. Write result to `alert_logs`

```mermaid
sequenceDiagram
    participant Cron as node-cron (Scheduler)
    participant Scraper as ScraperService
    participant DB as PostgreSQL
    participant Filter as FilterService
    participant Mail as NotificationService (SMTP)

    Cron->>Scraper: dispara ciclo (a cada N min)
    Scraper->>Scraper: GET páginas da fonte (até MAX_PAGES)
    Scraper->>DB: INSERT INTO jobs ... ON CONFLICT DO NOTHING
    Scraper->>DB: busca jobs ainda não notificados, por usuário

    loop para cada usuário ativo
        DB->>Filter: keywords (user_settings) + jobs candidatos
        Filter->>Filter: aplica filtro por keyword
        Filter->>DB: INSERT INTO notifications (pending) ON CONFLICT DO NOTHING
        DB->>Mail: notificações pendentes do usuário
        Mail->>Mail: envia e-mail com as vagas
        Mail->>DB: UPDATE notifications SET status = sent/failed
    end

    Scraper->>DB: INSERT INTO alert_logs (resultado do ciclo)
```

> Imagem renderizada: [`docs/diagrams/worker-flow.png`](docs/diagrams/worker-flow.png)

---

## Environment Variables (`.env.example`)

```
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/job4devs

# Auth
JWT_SECRET=your_jwt_secret_here
JWT_EXPIRES_IN=7d

# Email (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your@gmail.com
SMTP_PASS=your_app_password

# Worker
DEFAULT_CRON_INTERVAL_MINUTES=5

# URLs
FRONTEND_URL=https://app.job4devs.com
API_URL=https://api.job4devs.com
```
