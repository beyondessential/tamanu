---
name: added-test-summary
description: "Summarise the unit and e2e tests a branch/PR adds, run only those, and produce a paste-ready report (e.g. for a Linear card). Use when asked to 'summarise added tests', 'run the new tests', 'what tests did this PR add', or to prove a card's test coverage."
model: inherit
---

Produce a report of the tests **this branch adds** (vs its base) — unit and Playwright e2e — run only those, and format the result for pasting into a Linear card / PR. Only count what's genuinely new — entirely-new test files plus new cases inside otherwise-existing files. Do not pad the report with pre-existing tests.

## 1. Find the base

Default base is `main`. If the branch has an open PR, use its base instead:

```bash
gh pr view --json baseRefName -q .baseRefName   # falls back to: main
git fetch origin <base>
```

## 2. Inventory what's added

```bash
BASE=origin/<base>
# entirely-new test files (every case in these is new). `.test.*` = unit, `.spec.*` = e2e
git diff --name-status --diff-filter=A "$BASE"...HEAD | grep -iE '\.(test|spec)\.(js|ts|jsx|tsx)$'
# existing test files that changed (only some cases may be new)
git diff --name-status --diff-filter=M "$BASE"...HEAD | grep -iE '\.(test|spec)\.(js|ts|jsx|tsx)$'
# for each modified file, the new it()/test()/describe() lines
git diff "$BASE"...HEAD -- <file> | grep -E '^\+\s*(it|test|test\.describe|describe)\('
```

Build the precise list of added cases before running anything. Modified files usually contribute only a couple of new cases — name them from the diff.

## 3. Run only the added tests

Pick the runner by package, and run under the repo's Node (`.node-version`) against a local Postgres:

- `@tamanu/database`, `@tamanu/shared`, web packages → **vitest**: `npx vitest run <files>`
- `@tamanu/central-server`, `@tamanu/facility-server` → **jest**: `NODE_ENV=test npx jest <file>`
- `@tamanu/e2e-tests` (`*.spec.ts`) → **Playwright**: `npm run e2e-test` / `npx playwright test <file>`

For an **entirely-new file**, run the whole file. For a **modified file**, filter to the new cases so the report shows only what's added:

```bash
# jest: -t matches against the full "describe > it" name
NODE_ENV=test npx jest <file> -t "<shared substring of the new cases>" --verbose
# vitest: -t likewise, or just run the new file outright
npx vitest run <file> -t "<substring>"
# playwright: -g matches the test title
npx playwright test <file> -g "<substring>"
```

Caveats — when a runner can't run locally, **cite the branch's CI run** (`gh run list --branch <branch>` → `gh run view --log`) rather than reporting a false failure:
- A package's local `node_modules` may be stale (e.g. an `es-toolkit/compat`/`defaultsDeep` error) → its jest suite won't run.
- **e2e needs a running stack** — a reachable facility frontend + valid `packages/e2e-tests/.env` (`FACILITY_FRONTEND_URL`, `TEST_EMAIL`, `TEST_PASSWORD`) and the auth setup project. Without it, Playwright can't connect; report the *added* specs/cases from the diff and pull their pass/fail from CI.

## 4. Report

Group by runner (vitest / jest / Playwright e2e), list each added case with a `✓` (or the CI status when run there), and give per-runner totals plus a grand total of **added** tests. Keep pre-existing/`skipped` cases out of the headline count (mention them only as the reason for a `-t`/`-g` filter). Start the report with the branch and the commit SHA it was run at, and mark any runner whose result is cited from CI rather than run locally.
