# E2E tests

Playwright end-to-end tests for the Tamanu facility and admin web frontends.

CI runs these via [`.github/workflows/ci-e2e.yml`](../../.github/workflows/ci-e2e.yml), with the
environment built by [`.github/scripts/e2e-test-setup.sh`](../../.github/scripts/e2e-test-setup.sh).
Those two files are the source of truth for how the suite is meant to run — this guide replicates
the same setup on a local machine.

## Prerequisites

- Node version matching [`.node-version`](../../.node-version)
- PostgreSQL running locally
- Dependencies installed and frontends built:

  ```bash
  npm install
  npm run build          # or clean-build; the preview servers serve packages/web/dist
  npx playwright install chromium
  ```

> **Stale build warning:** the tests run against the *built* frontend (`vite preview` over
> `packages/web/dist`), not the dev server. If you change web code, rebuild before trusting test
> results — a stale `dist` silently tests old code.

## One-time environment setup

### 1. `.env`

Copy `.env.example` to `.env` in this package. The defaults suit a local run. Two values matter:

- `LAUNCH_LOCAL_SERVERS_WHEN_RUNNING_TESTS=true` makes Playwright launch the four servers itself
  (see the caveat under [Running the tests](#running-the-tests)).
- `TZ` must match the timezone your facility server displays in (`primaryTimeZone` /
  `countryTimeZone` in its config). CI uses `Pacific/Auckland` end to end; if your local server
  config uses another timezone, set `TZ` to that instead. A mismatch causes off-by-one-day
  failures in any test that asserts "today's" date.

### 2. Server configs

Point both servers at dedicated e2e databases in their `config/local.json5`, and disable rate
limiting (CI does; without it the test fixtures that create patients in quick succession hit 429s):

```json5
// packages/central-server/config/local.json5 and packages/facility-server/config/local.json5
{
  "rateLimit": { "enabled": false },
  "db": { "name": "<your-e2e-db>", /* ... */ },
}
```

See `e2e_test_setup_setup_central` / `e2e_test_setup_setup_facility` in the CI setup script for
the full configs CI uses (auth token duration, timezone, etc.).

### 3. Migrate and provision central

Copy the example provisioning file into the central server package (the copy is gitignored),
then migrate and provision:

```bash
cp packages/e2e-tests/provisioning.local-example.json5 packages/central-server/provisioning.json5
npm run --workspace @tamanu/central-server start upgrade
npm run --workspace @tamanu/central-server start provision provisioning.json5
```

The provisioning file mirrors the one CI writes (see the setup script). It creates the
`admin@tamanu.io` / `admin` login the tests use, a `facility-1` facility with its sync user,
the default reference data spreadsheet, the vitals/charting programs, and the feature settings
the tests rely on (`enableTasking`, `desktopCharting`, patient/encounter summaries, and
`deviceRegistrationQuota` off).

### 4. Configure and sync the facility server

The facility server no longer reads its sync connection purely from config — a fresh database
shows the setup wizard instead of the login page until sync facts are written. Configure it
headlessly with the `setupSync` subcommand, then run the initial sync before first start:

```bash
npm run --workspace @tamanu/facility-server start upgrade
SYNC_URL='http://facility-1%40tamanu.io:facility-1@localhost:3000' \
  SYNC_FACILITY_IDS='facility-1' \
  npm run --workspace @tamanu/facility-server start setupSync
npm run --workspace @tamanu/facility-server start sync
```

(The `%40` is an URL-encoded `@` in the sync user's email.)

## Running the tests

Two things are easy to get wrong:

1. **The test runner needs the tsx loader.** Spec files import `@tamanu/*` workspace TypeScript
   source, whose extensionless directory exports Node's ESM resolver can't complete on its own.
   Without it every spec fails to load with
   `Error: Directory import '.../@tamanu/constants/src' is not supported`.
2. **The servers must NOT get that loader.** `NODE_OPTIONS` is inherited by the `webServer`
   commands in `playwright.config.ts`, and tsx breaks the servers (CSS imports, vitest state
   errors). So either start the servers yourself in a clean shell, or export `NODE_OPTIONS`
   only for the test command, never globally.

The simplest reliable pattern — start the four servers in separate clean shells:

```bash
npm run start-dev --workspace=@tamanu/central-server        # :3000
npm run start-dev --workspace=@tamanu/facility-server       # :4000
npm run e2e-client-preview --workspace=@tamanu/web-frontend # :5173
npm run e2e-admin-preview --workspace=@tamanu/web-frontend  # :5174
```

The config's `reuseExistingServer: true` means Playwright will use them rather than launching its
own. Then, from this package:

```bash
cd packages/e2e-tests
NODE_OPTIONS="--import tsx" npx playwright test tests/basic/Basic.spec.ts --workers=1
```

- **Run one file at a time** while iterating; add `-g "AT-2001"` to run a single test.
- **Use `--workers=1`.** CI runs single-worker; the default local parallelism (one worker per
  core) makes tests race on shared tables — "row 0" assertions grab another test's patient and
  fail in confusing ways.
- Auth state is cached in `.auth/user.json` by the setup project; delete it to force a fresh
  login (e.g. after re-provisioning the databases).

## Troubleshooting

| Symptom | Cause / fix |
|---|---|
| `Directory import '.../@tamanu/constants/src' is not supported` on every spec | Missing `NODE_OPTIONS="--import tsx"` on the test command |
| Servers crash with `Unknown file extension ".css"` or vitest state errors | tsx loader leaked into the server processes — start them in a clean shell |
| Whole monorepo's unit tests get collected | Ran `npx playwright test` from the repo root instead of `packages/e2e-tests` |
| Login page never appears; "Set up this server" wizard instead | Facility server has no sync config — run `setupSync` + initial `start sync` (step 4) |
| Auth setup times out on the login button | Frontend up but backend not ready, or facility unprovisioned (see above) |
| `429 Too many requests` creating patients | Rate limiting enabled — disable it in both servers' `local.json5` |
| Dates off by one day (`17/07` vs `16/07`) | `.env` `TZ` doesn't match the server's display timezone |
| Assertions find another test's patient in row 0 | Parallel workers racing — run with `--workers=1` |
| Tests pass locally but fail on CI (or vice versa) after web changes | Stale `packages/web/dist` — rebuild the frontend |

## Suite conventions

For structure, page-object, and authoring guidance see
[`llm/project-rules/playwright-e2e.md`](../../llm/project-rules/playwright-e2e.md).
