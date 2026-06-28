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
# for each modified file, the new runnable cases (it()/test(), incl .only/.skip)
git diff "$BASE"...HEAD -- <file> | grep -E '^\+\s*(it|test)(\.(only|skip|each))?\('
```

Count only runnable cases — `it`/`test`. A new `describe`/`test.describe` is a suite wrapper, **not** a test; don't count it (count the `it`/`test` cases inside it). Build the precise list of added cases before running anything; modified files usually contribute only a couple.

## 3. Run only the added tests

Pick the runner from the package's own `test` script (don't assume — check it), and run under the repo's Node (`.node-version`) against a local Postgres. Current mapping:

- **vitest** — `@tamanu/database`, `@tamanu/web`: `npx vitest run <files>`
- **jest** — `@tamanu/shared`, `@tamanu/central-server`, `@tamanu/facility-server`: `NODE_ENV=test npx jest <file>`
- **Playwright** (e2e) — `@tamanu/e2e-tests` (`*.spec.ts`): `npx playwright test <file>`

Always pass the specific file(s) — never the bare workspace script (`npm run e2e-test`, `npm test`), which runs the whole suite and defeats "only the added tests". For an **entirely-new file**, run the whole file. For a **modified file**, filter to the new cases:

```bash
# jest: -t matches the full "describe > it" name
NODE_ENV=test npx jest <file> -t "<substring of the new cases>" --verbose
# vitest: -t likewise
npx vitest run <file> -t "<substring>"
# playwright: -g matches the test title
npx playwright test <file> -g "<substring>"
```

Caveats — when a runner can't run locally, **cite the branch's CI run** (`gh run list --branch <branch>` → `gh run view --log`) rather than reporting a false failure:
- A package's local `node_modules` may be stale (e.g. an `es-toolkit/compat`/`defaultsDeep` error) → its jest suite won't run.
- **e2e needs a running stack** — a reachable facility frontend + valid `packages/e2e-tests/.env` (`FACILITY_FRONTEND_URL`, `TEST_EMAIL`, `TEST_PASSWORD`) and the auth setup project. Without it, Playwright can't connect; report the *added* specs/cases from the diff and pull their pass/fail from CI.

## 4. Report

List **every** added case individually — one `✓` line per test, grouped by runner then file. Do **not** collapse to per-file counts (e.g. "connectionConfig.test.js 5 ✓"); show each test name. Use the CI status in place of `✓` for any runner cited from CI.

Give per-runner totals and a grand total of **added** tests. Keep pre-existing/`skipped` cases out of the headline count (mention them only as the reason for a `-t`/`-g` filter). Start the report with the branch and the commit SHA it was run at, and mark any runner whose result is cited from CI rather than run locally.
