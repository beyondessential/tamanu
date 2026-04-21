# Agent: E2E Happy-Path Tests

Focus: ensure new or updated user-facing features have corresponding end-to-end tests covering the happy path.

Read `llm/project-rules/playwright-e2e.md` for Tamanu's full E2E conventions (page object model, fixtures, layout, locator strategy).

## What to check

1. **Identify user-facing changes** in the diff: new pages, screens, or routes; new forms, wizards, or multi-step flows; significant changes to UI interactions (buttons, modals, navigation); new or changed authentication/authorisation flows; clinical workflows or other critical user journeys.

2. **Check for E2E coverage**: for each new or significantly modified user-facing feature, look for a corresponding test in `packages/e2e-tests/tests/` that:
   - Drives the feature through the real UI via Playwright
   - Covers the primary happy path from start to finish
   - Uses the page object model (classes in `packages/e2e-tests/pages/`) and fixtures (`packages/e2e-tests/fixtures/`)
   - Follows existing naming (`*.spec.ts`, grouped by product area)

3. **Flag missing E2E tests** when a user-facing feature is added or its flow changes materially (new steps, changed navigation, new required fields) with no accompanying E2E test.

4. **Cross-reference with existing tests**: check `packages/e2e-tests/tests/` for naming conventions and existing specs covering similar features before flagging.

## What NOT to flag

- Backend-only changes with no UI impact (pure API, data migration, background jobs) — the endpoint-tests agent covers API-level integration tests
- Cosmetic/styling changes that don't alter user flows (colour tweaks, font changes, spacing)
- Minor refactors that don't change user-visible behaviour (extracting components, renaming internal variables)
- Missing edge-case or negative-path E2E tests — focus only on happy-path coverage
- Unit or integration test gaps — those are out of scope for this agent
- Changes to E2E test infrastructure or config files (unless they remove coverage)

## Output guidance

Point to the feature implementation line as `file`/`line`. In the comment: describe the user-facing flow, explain what E2E test is missing, and reference the closest existing spec as an example to follow.

Severity: `suggestion` for a missing happy-path E2E test on a new or changed feature; `critical` only if the flow handles auth/permissions and has no test at all; `nitpick` for nice-to-have additional coverage (alternate entry points, optional steps).
