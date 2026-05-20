# Pulse V1 Design

## Status

- State: Ready For Design
- Source: `.claude/artifacts/scope/pulse-my8-pulse-v1-scope.md`
- Last updated: 2026-05-20

## Overview

Pulse v1 needs a mobile-first, touch-optimized private feed UI for high-signal recommendation cards. The visual direction should be inspired by https://www.effect.institute, https://www.effect.solutions, and https://www.kitlangton.com without turning v1 into a full branding exercise.

Use shadcn components and Tailwind v4 as implementation primitives, but avoid a generic dashboard look. The interface should feel like a compact signal surface: focused, readable, tactile, and optimized for quick inspection.

## Users And Goals

Seif is the only human user.

Goals:

- Open Pulse privately through Clerk authentication.
- See unread recommendations first.
- Quickly understand why each item matters.
- Open the original source when interested.
- Mark items read/unread.
- Leave thumbs up/down feedback with optional reasoning.

Layla/agents are producer actors, not UI users. They create feed items through the protected API.

## User Journeys

### Journey: Inspect Today's Signals

- Who: Seif
- Goal: See what is worth inspecting now.
- Trigger: Seif opens Pulse.
- Flow: Seif passes the Clerk-backed private access gate, lands on unread items sorted by recency, scans each card's title/source/TLDR/media, opens the source when useful, and marks items read as they are handled.

### Journey: Give Taste Feedback

- Who: Seif
- Goal: Tell Layla whether a recommendation was useful.
- Trigger: Seif reacts to an item.
- Flow: Seif taps thumbs up or down, optionally adds a short reason, and returns to the feed without navigating through a heavy form.

### Journey: Review Read Items

- Who: Seif
- Goal: Find previously inspected items.
- Trigger: Seif switches from unread feed to read/history.
- Flow: Seif opens a read/history view or filter where read items remain sorted by recency or read time.

## Required States

- Success: unread feed renders cards sorted by recency; feedback and read/unread changes visibly apply.
- Error: authentication failure, failed feed load, failed feedback submit, failed read/unread update, and failed source-open fallback must have clear messages.
- Loading: initial feed loading and per-action pending states must be visible without blocking the entire feed unnecessarily.
- Empty: unread feed empty state should communicate that there is nothing new to inspect.
- Partial: items without media must still feel complete; optional feedback reasoning can be absent.

## Data And Content Needs

Visible feed card content:

- Title.
- Source name or URL.
- Optional image/media.
- Body with TLDR/key information for quick glance.
- Created/received time or relative recency indicator.
- Read/unread state affordance.
- Open-source action.
- Thumbs up/down feedback controls.
- Optional reasoning input after feedback intent.

## Constraints

- Mobile-first and touch-first: large hit targets, comfortable vertical rhythm, readable card density, and no hover-only interactions.
- Private single-owner app using Clerk: no public profile, sharing, comments, likes, follows, or social graph UI.
- No manual feed item creation UI in v1.
- No extensive logo/identity system in v1.
- Use shadcn components and Tailwind v4.
- Keep UI centered on the single feed experience rather than a dashboard.

## Accessibility Requirements

- Interactive controls must be keyboard reachable.
- Touch targets should be at least 44px where practical.
- Feedback controls need accessible labels that distinguish thumbs up and thumbs down.
- Color cannot be the only signal for read/unread or feedback state.

## Related Patterns

- Effect references: technical, editorial, high-contrast, sparse-but-distinct visual language.
- Kit Langton reference: personal, compact, writing-forward, high-signal presentation.
- Social/article card metaphor: card should feel like a concise post or article recommendation, not a task card.

## Out Of Scope

- Full brand identity exploration.
- Multi-column desktop dashboard.
- Public social profile or sharing surfaces.
- Manual creation forms.
- Feed analytics or curation dashboards.

## Open Questions

None blocking breakdown.
