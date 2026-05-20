# Pulse v1 Deployment

This document covers the production deployment of Pulse v1 on Vercel + managed Postgres + Clerk.

## Required environment variables

Set these in the deployment environment (Vercel project → Settings → Environment Variables). The build step runs `bun run check:env` and fails fast on any missing value.

| Variable | Scope | Value |
|---|---|---|
| `DATABASE_URL` | Server | Postgres connection string. Must be a valid URL. Connection pooling is fine — the postgres-js client uses `prepare: false`. |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Client + Server | Clerk publishable key (`pk_test_…` or `pk_live_…`). |
| `CLERK_SECRET_KEY` | Server | Clerk server secret (`sk_test_…` or `sk_live_…`). |
| `ALLOWED_OWNER_USER_ID` | Server | Clerk user id of the single owner. Other authenticated users get a 403. |
| `INGEST_TOKEN` | Server | Bearer token presented by Layla/agents on `POST /api/ingest`. Minimum 8 characters; we recommend 32+ from `openssl rand -base64 32`. |

The schema is defined in [`src/lib/env.ts`](src/lib/env.ts). Boot the local validator:

```bash
bun run check:env
```

## Hosting target

- **Vercel** — Next.js 16 app. No special config beyond the env vars above.
- **Managed Postgres** — Vercel Postgres, Neon, Supabase, or Render all work. Just provide `DATABASE_URL`.

## Initial deploy

1. Create a Vercel project pointed at this repo.
2. Provision Postgres (Vercel Postgres / Neon / Supabase). Copy the connection string into `DATABASE_URL`.
3. Create a Clerk project. Copy the publishable + secret keys.
4. Sign in to the Clerk dashboard once, find your user id, set `ALLOWED_OWNER_USER_ID`.
5. Generate an ingest token: `openssl rand -base64 32`. Set `INGEST_TOKEN`.
6. Trigger a build. The build runs `bun run check:env` first and bails on any missing/invalid var.
7. After the first successful build, run database migrations once: `bun run db:migrate` against the production `DATABASE_URL` (Vercel CLI or run it locally with the prod URL exported).

## Migrations on deploy

The repo carries Drizzle migrations under [`drizzle/`](drizzle). They are append-only. To apply pending migrations to production:

```bash
# from a machine with the prod DATABASE_URL in the environment
bun run db:migrate
```

Two production-friendly patterns:

- **Vercel build step.** Add `bun run db:migrate &&` to the build command so every deploy migrates first. Cheap, but every deploy holds a lock for a moment.
- **Pre-deploy script.** Run `db:migrate` from a CI step or a one-off script before promoting the deploy. Safer for high-volume periods.

## Ingest token rotation

1. Generate a new high-entropy token: `openssl rand -base64 32`.
2. Update `INGEST_TOKEN` in the Vercel project env (Production).
3. Trigger a redeploy.
4. Update Layla / agent clients to present the new bearer.

The token is held in memory by the server process; the rate-limit store is also process-local, so rotation effectively resets per-token rate counters as a side effect.

## Curl example — Layla ingest

```bash
curl -X POST "https://pulse.example.com/api/ingest" \
  -H "Authorization: Bearer $INGEST_TOKEN" \
  -H "Content-Type: application/json" \
  --data '{
    "title": "Effect 4 beta release notes",
    "sourceUrl": "https://effect.website/blog/effect-4-beta",
    "sourceName": "effect.website",
    "summary": "TLDR: Effect 4 beta ships a redesigned schema module."
  }'
```

`title` is capped at 200 characters and `summary` at 2000 characters.

Expected responses:

- `201 { "id": "<uuid>" }` — created.
- `400 { "error": "Validation", "issues": [...] }` — body schema failed.
- `401 { "error": "Unauthorized", "reason": "..." }` — bearer missing or wrong.
- `409 { "error": "Conflict", "existingId": "<uuid>", "reason": "source_url already exists" }` — idempotent dedup.
- `429 { "error": "RateLimited", "retryAfterSeconds": N }` — rate limit hit; `Retry-After` header set.

## Curl example — Layla feedback sync

```bash
curl "https://pulse.example.com/api/feedback" \
  -H "Authorization: Bearer $INGEST_TOKEN"
```

Returns every recorded vote (including cleared votes with `vote: null`) so Layla can refresh her recommendation signals:

```json
{
  "items": [
    {
      "feedItemId": "…",
      "sourceUrl": "https://effect.website/blog/effect-4-beta",
      "vote": "up",
      "updatedAt": "2026-05-19T18:24:11.000Z"
    }
  ]
}
```

Same bearer token and per-token rate limit as `/api/ingest`. Newest changes come first (`updated_at DESC`); Layla can persist the highest `updatedAt` she's seen to detect what changed since the last sync.

## Owner sign-in

Visit `https://pulse.example.com/sign-in` (or any owner-protected route — Clerk middleware will redirect). Sign in as the owner; the home page renders the unread feed.

## Mobile / touch acceptance gate

The Playwright suite at `tests/e2e/mobile-gate.spec.ts` codifies the AC for mobile/touch UI checks. Run it against a built dev server:

```bash
bun run dev &
bun run test:e2e:install   # one-time, downloads browsers
bun run test:e2e
```

The fully-authed flow tests skip unless `CLERK_TESTING_TOKEN` and `PULSE_SEED=1` are set; they exercise the feed UI with seeded data.

## Observability and ops (post-v1)

V1 has no logging / tracing wiring. Effect's `Logger` and `@effect/opentelemetry/NodeSdk` are the natural next steps — see the patterns documented at `sst/opencode` for a working integration.

## Cleanup

Pulse has no scheduled jobs and no batch processing in v1. The Postgres tables grow unboundedly; expect to add archival / retention in v2.
