# Pulse

Pulse is a private signal feed for Seif where Layla, an AI assistant/agent, pushes high-signal items worth inspection.

V1 is scoped as a private, mobile-first application with an Effect v4 beta backend/API, Postgres + Drizzle persistence, Clerk authentication for Seif, protected agent ingestion, and a touch-optimized feed UI built with shadcn components and Tailwind v4.

The app should answer: "What should Seif know or inspect today, and why?"

## Product Boundaries

- Seif is the only human user in v1, authenticated through Clerk.
- Layla/agents create feed items through a protected, token-authenticated ingest API.
- Feed items are read or unread; the main view shows unread items sorted by recency.
- Feedback is thumbs up/down with optional reasoning.
- Manual feed item creation, public social features, multi-user roles, and extensive brand identity work are out of scope for v1.

See `.claude/artifacts/scope/pulse-my8-pulse-v1-scope.md` for the full v1 scope and `.claude/artifacts/design/pulse-my8-pulse-v1-design.md` for the design artifact.

## Stack

- Next.js (App Router) for the frontend shell.
- Effect v4 beta for backend service and API definitions.
- Postgres with Drizzle for schema and migrations.
- Clerk for owner authentication.
- shadcn components and Tailwind v4 for UI primitives.
- Bun as the package manager and runner.
- Vercel plus managed Postgres for production.

## Getting Started

Install dependencies and run the development server:

```bash
bun install
bun run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app. Edit `src/app/page.tsx` to make changes; the page auto-reloads.

## Scripts

```bash
bun run dev               # Start the dev server
bun run build             # Production build (runs check:env first)
bun run start             # Run the production build
bun run lint              # Biome lint/check
bun run format            # Biome format (write)
bun run typecheck         # tsc --noEmit
bun run test              # vitest unit + contract tests
bun run test:watch        # vitest watch mode
bun run test:e2e          # Playwright e2e (mobile/touch gates)
bun run test:e2e:install  # one-time: install Playwright browsers
bun run check:env         # validate environment variables
bun run db:generate       # generate a new Drizzle migration from src/server/db/schema.ts
bun run db:migrate        # apply pending migrations to DATABASE_URL
bun run db:push           # push schema directly (dev only — skips migrations)
bun run db:studio         # open Drizzle Studio against DATABASE_URL
```

## Environment

Runtime configuration is validated by `src/lib/env.ts` (Zod schema). The build script runs `check:env` and fails fast when any required variable is missing or invalid.

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | Postgres connection string (must be a valid URL). |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk publishable key, exposed to the client. |
| `CLERK_SECRET_KEY` | Clerk server-side secret. |
| `ALLOWED_OWNER_USER_ID` | Clerk user id of the single owner (Seif). Other authenticated users are 403'd. |
| `INGEST_TOKEN` | Bearer token presented by Layla/agents on `/api/ingest`. Minimum 8 characters. Rotated by setting a new value and redeploying. |

### Ingest Token Rotation

1. Generate a new high-entropy token (e.g. `openssl rand -base64 32`).
2. Set `INGEST_TOKEN` to the new value in the deployment environment.
3. Redeploy. Update Layla/agent clients to use the new bearer.

The default ingest rate limit is `60 req / 60 s` per token (see `src/server/auth/rate-limit.ts`). Requests exceeding the limit receive a `429` with a `Retry-After` header.

Validate the current shell environment before booting:

```bash
bun run check:env
```

## Deployment

See [`DEPLOYMENT.md`](DEPLOYMENT.md) for end-to-end Vercel + Postgres + Clerk setup, migration strategy, ingest token rotation, and a `curl` example for Layla.

## API

| Method | Path | Auth | Purpose |
|---|---|---|---|
| POST | `/api/ingest` | Bearer `INGEST_TOKEN` | Create a feed item (idempotent on `source_url`). |
| GET | `/api/feedback` | Bearer `INGEST_TOKEN` | Outbound list of all votes — Layla syncs this back into her recommendation loop. |
| GET | `/api/feed/unread` | Clerk owner | Cursor-paginated unread items, newest-first. |
| GET | `/api/feed/history` | Clerk owner | Cursor-paginated read items, sorted by read time. |
| PATCH | `/api/feed/:id/read` | Clerk owner | `{ read: boolean }` — toggle read state. |
| PUT | `/api/feed/:id/feedback` | Clerk owner | `{ vote: 'up'\|'down'\|null }` — upsert. |

Page routes:

- `/` — unread feed (owner only).
- `/history` — read items (owner only).
- `/sign-in` — Clerk hosted sign-in.

## Workflow

This project uses **beads** for issue tracking and **Anvil** workflow conventions. See `CLAUDE.md` and `.claude/CLAUDE.md` for agent guidance, and run `bd prime` for the full beads workflow reference.
