# Pulse V1 Scope

## Status

- State: Ready for Breakdown
- Source: pulse-my8
- Last updated: 2026-05-20
- Linked design: `.claude/artifacts/design/pulse-my8-pulse-v1-design.md`

## Problem And Outcome

Pulse is a private signal feed for Seif where Layla, an AI assistant/agent, pushes high-signal items worth inspection. V1 should deliver a complete production-capable product foundation: an Effect v4 beta backend/API for managing feed items, Postgres + Drizzle persistence, protected agent ingestion, single-owner private access, and a mobile-first touch UI inspired by the provided references.

The intended outcome is that Seif can open Pulse, see unread recommendations sorted by recency, inspect compact recommendation cards, open the original source when interested, and leave lightweight thumbs feedback with optional reasoning.

## Context

Captured source says Pulse is not a social network or generic read-it-later app. It should answer: "What should Seif know or inspect today, and why?"

User-provided references:

- https://www.effect.institute
- https://www.effect.solutions
- https://www.kitlangton.com

Current project state is a default Next.js starter, so product behavior is not constrained by existing app code.

## Decision Tree

- Outcome: V1 is a complete backend/API plus mobile-first UI for the private feed, not a seeded/manual-only MVP. Evidence: user answer during scoping.
- Users and actors: Seif is the only human user; Layla/agents are write-side producers via API. Evidence: captured source and user answers.
- Permissions: V1 uses Clerk for single-owner private access for Seif with no roles, admin screens, public signup, or invitations. Evidence: user selected single-owner gate and later specified Clerk for auth.
- Agent ingestion: V1 exposes a token-protected ingest path for Layla/agents, separate from Seif's UI session. Evidence: user selected token-protected ingest.
- Terminology: A feed item is like a social media post or X/article post with title, optional image/media, source, and body. The body contains a TLDR/key info for quick scanning. Evidence: user answer.
- Feedback: Feedback is thumbs up/down plus optional reasoning to express intent. Evidence: user answer.
- Item lifecycle: Items are read or unread. The main view filters out read items and sorts unread items by recency. Evidence: user answer.
- Data source of truth: Postgres is the source of truth for feed items, read state, and feedback. Drizzle owns schema/migrations. Evidence: user selected Postgres source of truth.
- Backend/API stack: Effect v4 beta is used for both backend and API. Evidence: user instruction.
- Frontend stack: shadcn components with Tailwind v4. Evidence: user instruction.
- UI shape: V1 is a single feed experience with mobile-first/touch-first cards. Evidence: user selected single feed experience.
- Production rollout: V1 targets Vercel plus managed Postgres, with required env vars for database, owner auth, and ingest token. Evidence: user selected Vercel plus managed Postgres.
- Acceptance gates: Breakdown should include Effect API contract tests, Drizzle schema/migration checks, API auth checks, and mobile/touch UI behavior checks. Evidence: user selected these gates.

## Requirements

1. The app must provide an Effect v4 beta backend/API for feed item management.
2. The API must support token-protected agent ingestion so Layla/agents can create feed items.
3. The API must support listing unread feed items sorted by recency.
4. The API must support marking items read/unread.
5. The API must support viewing read/history items outside the main unread feed.
6. The API must support thumbs up/down feedback with optional reasoning.
7. Feed items must include title, optional image/media, source, and body content containing a TLDR/key information for glanceable inspection.
8. Postgres must be the source of truth for feed items, read state, and feedback.
9. Drizzle must define and migrate the database schema.
10. The UI must be private and accessible only to Seif through Clerk-backed single-owner auth.
11. The UI must be mobile-first and optimized for touch-based devices.
12. The main UI must present unread feed items first and sort them by recency.
13. Read items must be filtered out of the main view, with a way to access read/history items.
14. Feed cards must make the TLDR/key information glanceable and provide a clear affordance to open the full source.
15. Feedback must be lightweight from the card or single feed experience: thumbs up/down with optional reasoning.
16. The frontend must use shadcn components and Tailwind v4 while applying custom styling inspired by the provided references.
17. V1 must be production-deployable on Vercel with managed Postgres.
18. Runtime configuration must use env vars for database connection, Clerk auth configuration, and agent ingest token.

## Acceptance Criteria

- [ ] An authenticated owner can access the private app and unauthenticated users cannot.
- [ ] A request with a valid agent ingest token can create a feed item through the API.
- [ ] Requests without a valid ingest token cannot create feed items through the agent endpoint.
- [ ] Feed items persist to Postgres through Drizzle-managed schema/migrations.
- [ ] The main feed shows unread items sorted newest first.
- [ ] Marking an item read removes it from the main unread feed.
- [ ] Read/history items remain accessible outside the main unread feed.
- [ ] A feed card displays title, source, optional media, TLDR/key body content, and a source-open action.
- [ ] Seif can submit thumbs up/down feedback and optional reasoning for a feed item.
- [ ] Effect API contract tests cover feed item creation, listing, read/unread updates, and feedback updates.
- [ ] Auth tests cover the single-owner gate and token-protected ingest endpoint.
- [ ] Drizzle schema/migration checks run in validation.
- [ ] Mobile/touch UI checks cover card readability, touch target sizing, and core feed interactions.
- [ ] Production deployment requirements for Vercel, managed Postgres, and required env vars are documented.

## Constraints And Dependencies

- Effect v4 beta is mandatory for backend/API work.
- Postgres and Drizzle are mandatory for persistence.
- shadcn components and Tailwind v4 are mandatory for frontend work.
- The app is private and single-owner in v1.
- Agent ingestion must be protected by a token or service credential.
- Production target is Vercel plus managed Postgres.
- Current validation setup has no test script configured; breakdown should include adding the required test/check scripts.
- The repository currently has no git remote configured, so the scope PR cannot be filed until VCS readiness is fixed.

## UI And Design Requirements

See `.claude/artifacts/design/pulse-my8-pulse-v1-design.md`.

## Architecture And Testing Strategy

- Backend/API: use Effect v4 beta for API definitions, request handling, dependency layers, error modeling, and service boundaries.
- Persistence: use Drizzle migrations against Postgres for feed items and feedback.
- Auth: use Clerk for owner UI access and keep it separate from agent token ingestion.
- Frontend: build a single mobile-first feed experience with shadcn primitives and Tailwind v4 styling.
- Tests/checks: add contract tests for API behavior, auth tests for owner/agent paths, migration/schema checks, and mobile/touch UI checks.

## Out Of Scope

- Public social networking features.
- Generic read-it-later workflows.
- Manual feed item creation in v1.
- Extensive branding and identity work.
- Multi-user collaboration, roles, invites, or admin screens.
- Full autonomous discovery/source crawling workflows beyond the protected agent ingestion API.
- Custom hosting/platform infrastructure beyond Vercel plus managed Postgres.
- Rich taxonomy, scoring, source credibility, or ingestion sync metadata unless required by implementation of the scoped feed item model.

## Open Questions

None blocking breakdown.

## Breakdown Readiness

Ready for Breakdown.

Blocked operationally for scope PR filing until the repository has a reachable git remote/push path.

## Design Decisions

- 2026-05-20: Scope v1 as a complete private feed product foundation with Effect v4 beta backend/API, Postgres + Drizzle, Clerk owner auth, protected agent ingestion, and mobile-first UI.
- 2026-05-20: Use Clerk for Seif's private UI authentication; keep Layla/agent ingestion on a separate token-protected API path.
- 2026-05-20: Keep manual feed item creation, extensive branding, public social features, and multi-user permissions out of v1.
- 2026-05-20: Use read/unread as the item lifecycle; filter read items out of the main feed and sort unread items by recency.
