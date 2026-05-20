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
bun run dev      # Start the dev server
bun run build    # Production build
bun run start    # Run the production build
bun run lint     # Biome lint/check
bun run format   # Biome format (write)
```

## Environment

Runtime configuration is provided through environment variables for:

- The Postgres connection string.
- Clerk owner authentication keys.
- The agent ingest token used by Layla/agents.

Specific variable names will be defined during breakdown and implementation.

## Workflow

This project uses **beads** for issue tracking and **Anvil** workflow conventions. See `CLAUDE.md` and `.claude/CLAUDE.md` for agent guidance, and run `bd prime` for the full beads workflow reference.
