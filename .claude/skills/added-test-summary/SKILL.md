---
name: added-test-summary
description: "Summarise the unit and e2e tests a branch/PR adds, run only those, and produce a paste-ready report (e.g. for a Linear card). Use when asked to 'summarise added tests', 'run the new tests', 'what tests did this PR add', or to prove a card's test coverage."
model: inherit
---

Report the tests a branch **adds** (vs its base), run only those, and format a paste-ready summary. Count only genuinely-new tests — new test files, plus new cases inside modified files; never pre-existing ones.

## 1. Base

The branch's PR base, else `main`:

```bash
BASE=origin/$(gh pr view --json baseRefName -q .baseRefName 2>/dev/null || echo main)
git fetch "${BASE#origin/}"
```

## 2. Inventory added tests

```bash
# new test files — every case in these is new (.test.* = unit, .spec.* = e2e)
git diff --name-status --diff-filter=A "$BASE"...HEAD | grep -iE '\.(test|spec)\.(js|ts|jsx|tsx)$'
# modified test files — only some cases may be new
git diff --name-status --diff-filter=M "$BASE"...HEAD | grep -iE '\.(test|spec)\.(js|ts|jsx|tsx)$'
# new cases within a modified file
git diff "$BASE"...HEAD -- <file> | grep -E '^\+\s*(it|test)(\.(only|skip|each))?\('
```

Count only `it`/`test`. A `describe`/`test.describe` is a suite wrapper, not a test — count the cases inside it, not the wrapper.

## 3. Run only those

Pick the runner from the package's own `test` script (check it; don't assume). Run under the repo's Node (`.node-version`) against local Postgres:

- **vitest** — `@tamanu/database`, `@tamanu/web`: `npx vitest run <file> [-t "<substring>"]`
- **jest** — `@tamanu/shared`, `@tamanu/central-server`, `@tamanu/facility-server`: `NODE_ENV=test npx jest <file> [-t "<substring>"] --verbose`
- **Playwright** e2e — `@tamanu/e2e-tests` (`*.spec.ts`): `npx playwright test <file> [-g "<title>"]`

Always pass the specific file — never a bare workspace script (`npm test`, `npm run e2e-test`), which runs the whole suite. Run a new file whole; use `-t`/`-g` to scope a modified file to its new cases.

When a runner **can't** run locally, cite the branch's CI run (`gh run list --branch <branch>` → `gh run view --log`) instead of reporting a false failure:
- stale `node_modules` (e.g. an `es-toolkit/compat` / `defaultsDeep` error) → jest won't run;
- e2e needs a running stack — a reachable facility frontend + `packages/e2e-tests/.env` (`FACILITY_FRONTEND_URL`, `TEST_EMAIL`, `TEST_PASSWORD`). Without it, list the added specs/cases from the diff and pull pass/fail from CI.

## 4. Report

Head with the branch + commit SHA. Group by runner → file, one line per added case (`✓`, or the CI status when cited). Don't collapse to per-file counts — show each test name. End with per-runner and grand totals of **added** tests; keep pre-existing/`skipped` cases out of the totals (mention them only to explain a `-t`/`-g` filter), and mark any runner cited from CI.
