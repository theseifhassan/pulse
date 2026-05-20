<!-- workflow:managed:start kind=shared-rules -->
# Anvil Workflow Rules

This repository uses project-owned Anvil bindings from `.claude/bindings.yaml`.

## Work Tracking

- Use `bd` for tracker operations because the configured tracker backend is beads.
- Run `bd prime` at the start of a session to load current beads workflow context.
- Claim work before implementation with `bd update <id> --claim` when working from an existing issue.
- Close completed beads issues with `bd close <id>` after validation succeeds.

## Artifacts

- Store workflow artifacts under `.claude/artifacts` using templates from `.claude/templates`.
- Preserve project-owned content outside workflow-managed marker blocks byte-for-byte.

## VCS And Review

- Use Graphite (`gt`) for stacked branch workflows when branch operations are needed.
- Use Greptile as the review backend when repository registration is available.
- Do not mutate external tracker, VCS host, or review-tool configuration during setup.

## Validation

- Run the validation commands declared in `.claude/bindings.yaml` before shipping changes.
- Do not print secrets; reference environment variable names instead of values.
<!-- workflow:managed:end kind=shared-rules -->
