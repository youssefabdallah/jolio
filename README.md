# Jolio

AI-powered job folio: finds relevant openings, audits fit against your real profile, and generates tailored LaTeX resumes, cover letters, emails, and answers. Next.js SPA + Laravel 11 API + Postgres, fully Dockerized.

## Stack

| Part | Tech |
|---|---|
| Frontend | Next.js 16 + React 19 + TypeScript + Tailwind (`apps/web`) |
| Backend | Laravel 11 JSON API (`apps/api`) |
| Database | Postgres 16 (+ Adminer for inspection) |
| Runtime | Docker Compose + root `Makefile` |

## Prerequisites

- Docker + Docker Compose v2
- PHP 8.4 + Composer and Node 24 + npm (only for running apps outside Docker)
- For local `artisan` DB access: `sudo apt install -y php8.4-pgsql`

## Quickstart

```bash
cp .env.example .env   # or just run make up — it creates .env for you
make up                # build images, start web + api (+ postgres + adminer)
make health            # smoke-test both containers
```

| Service | URL |
|---|---|
| Web | http://localhost:3000 |
| API | http://localhost:8000 (health: `/up`) |
| Adminer | http://localhost:8081 (server `db`, credentials from `.env`) |
| Postgres | localhost:5432 (database/user from `.env`) |

On first boot the API container waits for Postgres and runs `migrate --force` automatically. Local `apps/api/.env` is pre-wired to the same database (`pgsql @ 127.0.0.1:5432`).

## Useful commands

```bash
make up | down | restart | rebuild   # lifecycle
make logs | logs-api | logs-web      # follow logs
make ps | config | health            # inspect / validate / smoke-test
make migrate | fresh                 # migrate / wipe+reseed (destroys data)
make shell-api | shell-web | shell-db
make clean                           # stop + delete volumes (destroys the DB)
```

## Configuration

Secrets live only in root `.env` (gitignored — never commit it). Key variables:

```ini
API_PORT=8000  WEB_PORT=3000  ADMINER_PORT=8081
POSTGRES_DB=jolio  POSTGRES_USER=jolio  POSTGRES_PASSWORD=...  POSTGRES_PORT=5432
APP_KEY=            # empty = container generates an ephemeral key
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## Project structure

```
apps/web        Next.js SPA
apps/api        Laravel 11 API (Postgres via pdo_pgsql)
docs/           SPECS.md + ROADMAP.md (local only, gitignored)
docker-compose.yml
Makefile
.env.example
```

## Docs & roadmap

- `docs/SPECS.md` — product spec v1.0 (functional requirements, API, LaTeX pipeline)
- `docs/ROADMAP.md` — master plan: sprints S1–S14, backlog US-101…US-604, quality gates
- Current position: S1 — dev loop proven (`compose up` → web + api healthy, CI pending)
