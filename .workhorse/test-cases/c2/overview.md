# Test cases: migrate from jest to vitest

Verification for the runner migration. There is no product behaviour to test here, so these
cases are about the suites themselves: the same tests, discovered and passing under vitest,
with the jest-only scaffolding gone and nothing silently skipped.

Run each package's suite from its own directory against a local Postgres, one at a time.
Concurrent runs of two suites collide on the per-pool-slot database names (`<db>-1`..`-N`) and
produce spurious `duplicate key ... pg_database_datname_index` failures — that is expected, not
a regression.

## Test discovery

- [x] `@tamanu/central-server` collects exactly 180 test files, matching the pre-migration count
- [x] `@tamanu/facility-server` collects exactly 100
- [x] `@tamanu/shared` collects exactly 17
- [x] `@tamanu/settings` collects exactly 6
- [x] Root `vitest run` collects every vitest package and nothing else — mobile's 49 jest files,
      e2e-tests' Playwright specs and `scripts`' tape tests must not appear

## Suites pass

- [x] `@tamanu/settings` passes
- [x] `@tamanu/shared` passes, including the two files that needed hand-work: the logging env-var
      suite (`jest.isolateModules` + `require` to `vi.resetModules` + dynamic import) and the
      ScheduledTask suite (fake timers, and a `shortid` mock that now has to return `default`)
- [x] `@tamanu/facility-server` passes (100 collected: 99 passed, 1 skipped)
- [x] `@tamanu/central-server` passes (180 collected, 1488 passed)
- [x] `@tamanu/database` passes with `--no-file-parallelism` removed
- [x] `@tamanu/upgrade` passes with `--no-file-parallelism` removed (needs its `pretest`
      translation scrape to have run: an empty `default-translations.json` fails two cases)
- [x] `@tamanu/web` passes with `globals: true` replaced by an explicit `afterEach(cleanup)`
      setup file — RTL's auto-cleanup is only registered when a global `afterEach` exists

## CJS-to-ESM edges

These are the cases where jest's CommonJS compilation hid a difference, so each is a place the
migration could pass lint and still be silently wrong.

- [x] A suite that mocks `config` gets its override honoured, not the real config: the factory
      has to replace the `default` export because consumers use `import config from 'config'`.
      Covered by the sync lookup-table and scheduled-task-config suites
- [x] A mock of a default-export module (`shortid`, `cli-table3`, `read`) resolves to the mock
      rather than `undefined`
- [x] A mock used with `new` returns the stand-in: vitest only honours the return value when the
      implementation is a `function`, not an arrow (`CentralServerConnection` in the facility
      summary, user-auth and upload-attachment suites)
- [x] Dynamic `import()` of an absolute path passed as a `file://` URL still resolves, with
      `jest.resolver.cjs` deleted. Covered by the migration resolver in `@tamanu/database`
- [x] `sequelize`, `@smithy/middleware-retry` and `@aws-sdk/client-s3` load natively rather than
      being transformed, as the dropped `transformIgnorePatterns` whitelist required
- [x] A partial mock does not break the graph on an export it doesn't declare: vitest errors
      where jest gave `undefined`, so a partial mock has to spread the real module. Covered by
      the `app/database` and `xlsx` mocks

## Mocking reach

- [x] Every facility suite runs against a stubbed central server — no suite reaches the network
      because the setup file's `vi.doMock` applies to the test file's module graph
- [x] The facility suites that drive the mock directly still can: the summary suites, user auth,
      and the attachment upload suites
- [x] `vi.mock` nested in a function, block, or `describe`/`test` callback is a lint error

## Seed reproducibility

- [x] A run prints its seed, and re-running with `TAMANU_TEST_SEED=<n>` generates the same fake
      data. Verifiable in any package that uses `@tamanu/fake-data`
- [x] A seed of `0` is honoured rather than treated as absent

## Repo-level

- [x] `npm run lint-all` reports no errors, including for the repo-root `vitest.config.ts`
- [x] Root `npm test` still runs mobile (jest), e2e-tests (Playwright) and `scripts` (tape)
      alongside the vitest packages — `test-all.mjs` walks exactly those three and skips the
      eight the root `vitest run` covers
- [x] `npm install` resolves — vitest at the root brings an optional `@opentelemetry/api` peer
      that conflicts with the artillery chain in `synthetic-tests` unless overridden
- [x] CI's `npm run --workspace <package> test -- --shard i/n` works unchanged; vitest takes the
      same `i/n` shard format jest did
