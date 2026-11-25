# ReachInbox — Email Scheduling Platform

A production-style email scheduling service and web dashboard built without cron jobs—all scheduling runs on Redis-backed BullMQ delayed jobs.

**Tech Stack**

* **Backend**: TypeScript, Express, BullMQ (Redis), PostgreSQL (Prisma), Ethereal SMTP, Elasticsearch
* **Frontend**: React, TypeScript, Tailwind CSS (Vite)

---

## Quick Start

**Prerequisites:** Node.js 20+, PostgreSQL, Redis. *(Optional: Elasticsearch, Google OAuth, Slack App. No Docker required.)*

**1. Backend**

```powershell
cd backend
npm install
copy .env.example .env   # Set DATABASE_URL, REDIS_URL, JWT_SECRET
npx prisma migrate dev --name init
npm run seed             # Creates a demo user + Ethereal SMTP sender
npm run dev              # Runs API + Worker (or use `npm run worker` to scale workers)

```

* API: `http://localhost:4000` | Queue UI (Bull Board): `http://localhost:4000/admin/queues`

**2. Frontend**

```powershell
cd frontend
npm install
copy .env.example .env
npm run dev              # Opens at http://localhost:5173 (proxies /api to :4000)

```

*Tip: Use the **Demo Account** button on the login page if Google OAuth isn't configured yet (auto-disabled in production).*

---

## Core Architecture & Features

* **Zero Cron, Restart-Safe**: Emails are saved in Postgres and queued as BullMQ delayed jobs with deterministic IDs (`email-<id>`). On startup, `reconcilePendingEmails()` re-queues any pending DB rows missing from Redis, and idempotent workers prevent duplicate sends.
* **Distributed Rate Limiting**: Uses atomic Redis Lua scripts to enforce per-sender minimum send delays (default `2000ms`), per-sender hourly caps (default `200/hr`), and optional global caps. Rate-limited jobs are never dropped—they are automatically deferred (`moveToDelayed`) to the next hour window.
* **Ethereal SMTP**: Automatically provisions test SMTP accounts per sender and displays message preview URLs in the Sent tab.
* **Search & Fallback**: Indexes emails in Elasticsearch for fast search, with automatic fallback to PostgreSQL (`ILIKE`) if ES is unavailable.
* **Slack Alerts**: OAuth integration sends deduplicated `chat.postMessage` alerts (once per sender per hour) when a rate limit is hit.
* **Dashboard**: Google OAuth, Scheduled/Sent tabs, CSV/text bulk recipient composer, Ethereal preview links, and server-side pagination, filtering, sorting, and row virtualization.

---

## Key API Endpoints

| Area | Endpoints |
| --- | --- |
| **Auth** | `GET /api/auth/google`, `POST /api/auth/dev-login`, `GET /api/auth/me`, `POST /api/auth/logout` |
| **Senders** | `GET /api/senders`, `POST /api/senders`, `DELETE /api/senders/:id` |
| **Emails** | `POST /api/emails/schedule`, `GET /api/emails` (supports `tab`, `search`, `page`, `senderId`, `status`, `from`/`to`, `sortBy`), `DELETE /api/emails/:id` |
| **Slack** | `GET /api/slack/connect`, `GET /api/slack/status`, `POST /api/slack/test`, `POST /api/slack/unsubscribe` |
| **System** | `GET /health`, `GET /admin/queues` |

---

## Production Notes

* Set Redis eviction policy to `noeviction` so delayed BullMQ jobs are never purged.
* Encrypt stored Slack bot tokens (currently plaintext in DB) and prefer cookie-only JWT auth with CSRF protection in production.
