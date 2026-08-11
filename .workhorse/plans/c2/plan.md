# Migrate from jest to vitest for existing test suites

## Why

Jest is the only place in the repo where swc defines **module semantics**. The servers run
`node --import tsx app` with `"type": "module"`, while `@swc/jest` compiles the same source to
CommonJS for tests. The suite therefore validates a build that ships nowhere.

Three things in `common.jest.config.mjs` exist only to prop that up, with no production counterpart:

- `moduleNameMapper: { '^(\\.{1,2}/.*)\\.js$': '$1' }`, rewriting the repo's `.js`-extension-on-`.ts`
  convention for jest's resolver, which tsx handles natively
- `transformIgnorePatterns` whitelisting `lodash-es`, `es-toolkit`, `@tamanu`, needed only because
  CJS cannot consume ESM-only dependencies
- `resolver: jest.resolver.cjs`, which strips the `file://` scheme off dynamic-import specifiers.
  Production code must pass a file URL (`pathToFileURL(...).href`) because ESM rejects a bare
  Windows `C:\…` path; swc then compiles that `import()` to a `require()`, which jest's default
  resolver cannot follow. The whole file is a workaround for the CJS fiction

Deleting all three hacks is the deliverable. Vitest's feature set (projects, module-graph watch,
merged coverage, `--typecheck`) is the second motivation.

They are not deleted into nothing: vitest needs its own resolution setup, already proven in
`packages/database/vitest.config.ts` and `packages/upgrade/vitest.config.ts`. That is the
`tamanuSourceResolve` plugin, `resolve.conditions: ['source', 'module', 'development|production']`,
and `server.deps.inline: [/@tamanu\//]`, consuming workspace packages from TypeScript source. The
win is that this is vite's resolution, the same machinery the frontends already build with, rather
than a jest-only CJS fiction. Central and facility additionally whitelist `sequelize`,
`@smithy/middleware-retry` and `@aws-sdk/client-s3` for transformation; under vitest those stay
externalised and load natively, which should be verified rather than assumed.

swc does not leave the repo: `@vitejs/plugin-react-swc` stays in web and patient-portal, `@swc/cli`
in build-tooling and mobile. This card removes `@swc/jest` specifically.

## Starting position

Already on vitest 4: `database`, `utils`, `upgrade`, `web`.

Still on jest: `central-server` (180 test files), `facility-server` (100), `shared` (17),
`settings` (6), `mobile` (49). `fake-data` has no tests of its own but is not merely config: its
source reads the jest global (see the seed finding below).

## Decisions

**Mobile is out of scope.** It uses `@react-native/jest-preset` with `babel-jest` + `ts-jest`, not
`@swc/jest`, so excluding it does not keep swc-as-module-semantics alive. React Native core ships
Flow-typed source that esbuild and vite cannot parse, and mobile's production bundler is Metro
(Babel), so its test compilation already matches its production compilation. Its jest setup is
correct by this card's own logic.

**No compat shim.** A runtime `globalThis.jest = vi` alias was considered and rejected. It would
also have been partly broken: vitest's mock hoisting is a compile-time transform keyed on the
literal identifier `vi` (per `@vitest/mocker`: "The naming of `vi` matters, it is used by the
compiler"), so aliased `jest.mock()` calls would register after their imports rather than before.

**Explicit imports, not `globals: true`.** Already unanimous across the 98 migrated test files:
database 22/22, utils 21/21, upgrade 8/8, web 47/47 all `import { ... } from 'vitest'`. Web's
`globals: true` is vestigial and can be dropped.

**Root `projects` config is in scope**, including folding the four already-migrated packages in.

**CI keeps per-package invocation.** `plan-ci.mjs` already builds a dynamic sharded matrix
(`SERVER_SHARDS` shards each for central and facility, Postgres only where needed, untouched
packages skipped). Collapsing that into one root invocation would be a wall-clock regression.
Vitest's `--shard <index>/<count>` matches the format CI already passes, and projects keeps each
package's own config file, so `npm run --workspace "$package" test -- --shard i/n` works unchanged.
Projects buys local watch and merged coverage, not CI throughput.

**Land as one change, not staged.** Six live release branches (2.56 to 2.61) mean cherry-pick
conflicts on test files either way, and house style is not to stage. Central and facility go in one
PR since they are 280 of the ~300 files.

**Drop `jest-extended`.** 77 call sites across 3 matchers only.

## Conversion sizing

| Bucket | Size | Treatment |
|---|---|---|
| `jest.mock` / `unmock` in test files | 36 sites, all top-level | codemod, mechanical |
| `jest.mock` in non-test files | 4 sites, 3 files | hand-work: see hoisting reach below |
| `requireActual` / `doMock` / `isolateModules` | 25 files (13 central, 10 facility, 2 shared) | hand-work: sync to async restructure |
| `fn` / `spyOn` / `clearAllMocks` etc | ~68 files | codemod |
| `jest.setTimeout` | 25 sites, incl. all four setup files | `testTimeout` config or `vi.setConfig` |
| `jest.useFakeTimers` | 5 sites | hand-check: vitest fakes a different default set of timers |
| `@jest/globals` imports | 17 files | module-specifier swap |
| `toBeEmpty` | 73 sites, 12 files, all central | mostly `expect(errors).toBeEmpty()` on arrays, to `toHaveLength(0)` |
| `toBeTrue` / `toBeFalse` | 4 sites | `toBe(true)` / `toBe(false)` |

Vitest 5 will throw (v4 warns) on `vi.mock` inside a function, block, or `describe`/`test` callback,
so an ESLint rule should lock that in.

`jest-extended`'s `toBeEmpty` also covers objects, strings and iterables. All 73 sites are in
central-server (which is also the only package declaring `jest-extended`), across 12 files, so the
audit is contained; stragglers can join the four custom matchers already hand-maintained in
`configureEnvironment.js` (`toBeForbidden`, `toHaveRequestError`, `toBeProblemOfType`,
`toHaveSucceeded`).

### Mock hoisting reach

Being top-level in its own file is not sufficient. Vitest hoists `vi.mock` only within the file it
is written in, and its static analysis requires `vi` to have been imported from `vitest` in that
same file: per the docs, "`vi` that was not directly imported from the `vitest` package (for
example, from some utility file) cannot be used". This is the same constraint that killed the compat
shim, applied to the repo's own helpers. Jest's per-test-file module registry hides the difference
today.

Three files rely on reach that vitest does not give:

- **`packages/facility-server/__tests__/utilities.js:40-41`** mocks
  `../app/sync/CentralServerConnection` and `../app/utils/uploadAttachment`. **85 of the 100 facility
  test files import this module**, so those two lines are load-bearing across most of the package.
  The mocks have to move into the test files that need them, by codemod, and the file itself also
  imports `CentralServerConnection` directly at line 35
- **`packages/central-server/__tests__/configureEnvironment.js:20`** mocks
  `../app/utils/getFreeDiskSpace` from a setup file. Vitest "will not mock modules that were imported
  inside a setup file because they are cached by the time a test file is running", so this needs
  relocating or a `vi.hoisted` plus `vi.resetModules()` workaround
- **`packages/shared/src/test-helpers/spyOn.js`** exports `spyOnModule(jest, path)`, which takes the
  runner as a parameter and calls `jest.mock` inside itself. This cannot be ported in that shape. It
  has exactly one call site
  (`packages/central-server/__tests__/subCommands/importReport/actions.test.js:16`), so delete the
  helper and inline a literal `vi.mock` there

The seven bare `jest.mock(path)` calls with no factory are fine on their own axis: with no factory
and no `__mocks__` folder, vitest imports the original module and auto-mocks all its exports. There
are no `__mocks__` directories outside mobile.

## Verification findings

**There are four `configureEnvironment.js` files, not two,** and porting them is more than matchers.
Central and facility carry the custom matchers; shared and settings carry only
`jest.setTimeout(100000)`. Central's is **CommonJS** (`require(...)`, `globalThis.crypto =
require('crypto')`) inside a `"type": "module"` package, which works only because `@swc/jest`
compiles it to CJS, so it has to be rewritten as ESM. Both server packages also load
`jest-expect-message`, central via `require` in the setup file and facility via a bare
`import 'jest-expect-message'` at `__tests__/utilities.js:1`, on top of the `setupFilesAfterEnv`
entries.

**`jest.resolver.cjs` is deleted, not ported.** It exists because swc compiles
`await import(pathToFileURL(path).href)` down to a `require()` that jest's resolver then chokes on.
There are two such call sites, `packages/database/src/services/migrations/migrations.js:247` and
`packages/upgrade/src/listSteps.ts`, and `upgrade` already runs the same pattern under vitest with
no resolver of its own. Vitest keeps the `import()` as ESM, where a `file://` specifier is the
correct thing to pass. Confirm against `packages/database`'s suite, which covers the migration
resolver directly.

**The canary does not cover the canary's purpose.** Shared and settings were chosen to surface
CJS-to-ESM breakage cheaply, but their setup files are one line each and neither package has the
helper-file mock problem. The CJS setup file, the 85-file mock fan-out, and the sequelize/AWS
transform whitelist all live in central and facility. Keep the canary for the cheap signal, but do
not read a green canary as evidence about the servers.

**`maxWorkers` percentages port verbatim.** Type is `number | string`; a percentage string
"computes the worker count as the given percentage of the machine's available parallelism" via
`os.availableParallelism`. So `isCI ? '50%' : '25%'` carries over unchanged.

**`workerIdleMemoryLimit` has no equivalent, and this is the main risk.** The current value
(`'512MB'`) is annotated "workaround for memory leaks". Vitest's only memory-recycling option is
`vmMemoryLimit`, documented as affecting "only `vmForks` and `vmThreads` pools"; the source
comments "just ignore `memoryLimit` value because we cannot detect memory limit" for other pools.
The default `forks` pool cannot recycle workers on memory pressure. Note that jest already gives
each test file its own module registry and leaked anyway, so vitest's `isolate: true` should not be
assumed to fix it. If it bites on the 180-file central suite, the fallback is `vmForks` plus
`vmMemoryLimit` for that project.

**Decision: do not spike this, and do not let it gate the migration.** The limit only bites in CI,
and it bites as "massively slower" rather than as a failure, so an isolated spike would have to run
in CI and would still be confounded. Migrate first, then treat CI time as its own optimisation pass.

The baseline below supports that: run-to-run variance on the same job is already north of 30%, so
only a large regression would be distinguishable anyway, which is exactly the failure mode described.

Levers available for the later optimisation pass, roughly in order of cost:

1. `SERVER_SHARDS` is a single constant in `plan-ci.mjs` (currently 8). Raising it spreads files
   across more runners and directly reduces per-process accumulation. It is a CI-time lever
   regardless of whether memory turns out to be the cause
2. `maxWorkers` tuning per project
3. `vmForks` plus `vmMemoryLimit` for central-server only, which restores recycling at some speed cost

## CI baseline before migration

Captured from two successful `ci.yml` runs on `main` (31135832256 and 31097899569), so post-migration
timings have something to compare against. Job durations include checkout, `npm install` and Postgres
setup, not just test execution, which damps the visible size of any test-execution delta.

| Job | Run A (min) | Run B (min) |
|---|---|---|
| central-server, slowest of 8 shards | 5.1 | 3.8 |
| central-server, fastest of 8 shards | 3.6 | 2.8 |
| facility-server, slowest of 8 shards | 3.5 | 2.2 |
| facility-server, fastest of 8 shards | 2.7 | 1.8 |
| database (per pg version) | 2.9 to 3.5 | 2.0 to 2.3 |
| web-frontend | 3.0 | 2.2 |
| mobile | 2.6 | 1.7 |

The `test` job's critical path is the slowest central shard, so roughly 4 to 5 minutes. The same job
varied by about 34% between these two runs, which sets the detection floor: anything short of a
~1.5x regression will not be readable without repeated runs.

**No test-discovery drift.** Verified across all four packages: 180 / 100 / 17 / 6 files match under
both jest's `testRegex` and vitest's default `include`. No files literally named `test.js` or
`spec.ts` (which jest's `/` alternative would match and vitest's glob would not), and nothing under
`app/`, `dist/`, or `__disttests__`, so `testPathIgnorePatterns` is currently a no-op. Post-migration
counts should match exactly, which is a clean assertion for the PR.

**`showSeed` is live and load-bearing, and porting it needs real work.** The seed is not only used
for test ordering (which is not randomised here). `packages/fake-data/src/fake/fake.ts:71` reads it:

```ts
export const chance = new Chance(global.jest?.getSeed() ?? randomInt(2 ** 42));
```

So the seed determines **all generated fake data** across the suites, and `showSeed: true` prints it
so a data-dependent failure can be reproduced with `jest --seed <n>`. The comment calling it
"order-dependence" is a misnomer; it is data-dependence.

Vitest's `getSeed()` is not a drop-in, for two reasons. It is a **node-side** API on the Vitest
instance (4.0.0), not reachable from inside a test worker. And it deliberately returns null unless
tests are actually randomised, which their own e2e test asserts (`expect(ctx?.getSeed()).toBe(null)`).
`packages/vitest/src/node/logger.ts` does print it, but only when non-null.

Note this mechanism is **already broken** for the four migrated packages: `global.jest` is undefined
under vitest, so `fake-data` already falls through to `randomInt(2 ** 42)` there, unreproducibly.
The migration does not break it; it is the opportunity to fix it properly.

The port is to own the seed rather than borrow the runner's. Resolve
`TAMANU_TEST_SEED ?? randomInt(2 ** 42)` once, put it in the environment (the `forks` pool inherits
`process.env`, so workers get it), print it at startup, and have `fake.ts` read the env var. Then
`TAMANU_TEST_SEED=12345 npm test` reproduces a run. Use an explicit undefined check rather than
`Number(x) || fallback`, so a seed of `0` is not silently discarded. Feeding the same value into
`sequence.seed` means that if shuffle is ever turned on, ordering and data share one seed.

This is strictly better than what jest gave: runner-agnostic, works for the already-migrated
packages and for non-test callers of `fake-data`, and survives sharding.

**`.new-package` was stale beyond its test config, and has been deleted** along with
`scripts/create-package.mjs` and the root `create-package` script entry.

It carried `jest.config.mjs`, a `__tests__` directory, and a `.swcrc`, the last being notable
because `common.jest.config.mjs` states "there are no per-package `.swcrc` files left to locate".
Its `package.json` also still described the pre-build-less world (`main: dist/cjs/index.js`,
`module: dist/mjs/index.js`, `exports` pointing at `dist`, `build:src` running `swc`) while real
packages now use `"exports": { ".": "./src" }`. Anything scaffolded from it would have needed
rework immediately.

Staleness confirmed by history: its last two touches were a repo-wide rebrand and a Turborepo
change, both sweeping, with no deliberate maintenance since the repo went build-less. Nothing else
referenced it. `plan-ci.mjs` already skipped it via `if (dir.startsWith('.')) continue;`, and it was
never a workspace member, so CI and installs are unaffected.

## Project discovery

A bare `projects: ['packages/*']` glob is wrong: vitest treats a globbed directory with no vitest
config as a project **with defaults**, and its default `include` would sweep in `mobile` (48 jest
files), `e2e-tests` (Playwright `*.spec.ts`), and `scripts` (tape tests under `tests/**/*.test.*js`).

`plan-ci.mjs` already reads every `packages/*/package.json`, discovers which have a `test` script,
and holds a `SPECIAL_PACKAGES` exclusion set, so it looks like the list is already there. It is not:
the two configs ask different questions and the answers differ in four places.

`SPECIAL_PACKAGES` means "has bespoke CI handling, keep it out of the standalone matrix". It
excludes `central-server`, `facility-server` and `database`, which are precisely the packages that
**must** be vitest projects. And `scripts` (whose `test` script is `tape 'tests/**/*.test.*js'`) is
not in the set, so it correctly earns a CI matrix entry while equally correctly not being a vitest
project. Deriving one list from the other inverts the answer for all four.

Share the narrower fact instead: **which packages run vitest**, keyed on the presence of a vitest
config file. `plan-ci.mjs` can consume that where it is useful, but keeps `SPECIAL_PACKAGES` as its
own separate concern. That still gives the drift protection (a package cannot run vitest without
appearing in the project list) without conflating two different questions.

## Work

- [x] Shared "which packages run vitest" module for the project list (`scripts/vitestProjects.mjs`),
      keyed on the presence of a `vitest.config.ts`. `plan-ci.mjs` keeps its own `SPECIAL_PACKAGES`
      set. The consumer that earns the module is `scripts/test-all.mjs`, which uses it to skip the
      packages the root `vitest run` already covers
- [x] Root `vitest.config.ts` with `projects` and root-only `coverage`. No `reporters` entry: CI
      invokes each package separately, so a root reporter would never apply there
- [x] Rewrite `common.jest.config.mjs` as `common.vitest.config.mjs` carrying `tamanuSourceResolve`,
      `resolve.conditions`, `server.deps.inline`, `maxWorkers` and the test seed. Stays a shared
      module because projects do not inherit root options unless a project sets `extends: true`
- [x] Add `vitest` as a devDependency to the root and to `central-server`, `facility-server`,
      `shared`, `settings`. Adding it at the root hoists vitest out of the four packages that
      already nested it, which surfaces its `peerOptional @opentelemetry/api ^1.9.0` against the
      `@opentelemetry/api@1.4.1` the artillery chain in `synthetic-tests` pins below 1.5. Defused
      with a vitest-scoped override (`"overrides": { "vitest": { "@opentelemetry/api": "1.4.1" } }`)
      rather than a repo-wide pin — the peer is optional and unused
- [x] `shared` + `settings` as a throwaway canary. It did earn its keep: both CJS-to-ESM default-export
      failures it caught (`vi.mock('shortid', () => fn)` needing `{ default: fn }`, and
      `jest.isolateModules` + `require`) recur in the server packages
- [x] `VITEST_POOL_ID` in `packages/database/src/services/database.js`, replacing `JEST_WORKER_ID`.
      **Confirmed** by probe on vitest 4.1.10: `VITEST_POOL_ID` is 1-based (`'1'`), and
      `VITEST_WORKER_ID` is 0-based and monotonic — so the plan's concern about unbounded databases
      holds for the latter. This also un-serialises `packages/database` (`--no-file-parallelism`
      dropped)
- [x] `packages/upgrade`'s `--no-file-parallelism` had no cause of its own: its suites use fake
      sequelize objects and never touch a database, so the flag was carried over from `database`.
      Dropped
- [x] Replace the fake-data seed mechanism: `scripts/testSeed.mjs` resolves
      `TAMANU_TEST_SEED ?? randomInt(2 ** 42)` once, puts it back in the environment, prints it, and
      `fake.ts` reads the env var. Also fixes the four already-migrated packages
- [x] Facility's two helper-file mocks, resolved differently from the plan: they moved into the setup
      file as `vi.doMock`, not into the 85 importers. Only 7 files actually reference the mocks, so
      the fan-out was never the real requirement — what is load-bearing is that no facility suite
      reaches the network. The docs' caveat is narrower than "setup files can't mock": a setup file
      cannot mock a module *it has already imported*, which is satisfied by extracting `extendExpect`
      into `__tests__/extendExpect.js` so the setup file no longer pulls in the app graph
- [x] Move `jest.mock('../app/utils/getFreeDiskSpace')` out of central's setup file, into
      `attachment.test.js` — the only suite that touches the upload routes
- [x] Delete `packages/shared/src/test-helpers/spyOn.js`. Its one call site was dead: the helper
      re-exports the actual module so its exports can be spied on, and that test spies on nothing.
      Deleted the call rather than porting a no-op
- [x] Convert `facility-server` (100 files)
- [x] Convert `central-server` (180 files)
- [x] Fold `database`, `utils`, `upgrade`, `web` into projects. Web's `globals: true` was **not**
      vestigial, in two ways. It was masking `DownloadDataButton.test.jsx` using `expect` with no
      import (now imported), and more importantly it was what made React Testing Library register
      its own cleanup — RTL only does that when a global `afterEach` exists. Without it 46 tests
      failed on DOM left behind by the previous case. Web now registers `afterEach(cleanup)` in a
      setup file, which keeps the explicit-imports property that lets ESLint catch the first
      problem while fixing the second
- [x] Port the `configureEnvironment.js` files. Central's CJS body became ESM, and its
      `globalThis.crypto = require('crypto')` and `global.TextDecoder` shims are gone: both were
      jest-environment workarounds, and under vitest's node environment the real globals are present,
      which is what production gets
- [x] The runtime `jest.setTimeout` dance in both `createTestContext`s (24h during setup, 45s after)
      is now config: `testTimeout: 45_000` — what tests actually ran with — and
      `hookTimeout: 600_000` for the db-recreate-and-migrate in `beforeAll`. The per-file
      `jest.setTimeout(50000..60000)` calls were dead under jest for the same reason (createTestContext
      reset the timeout after them); they carry over as `vi.setConfig({ testTimeout })`, which makes
      them live and slightly more generous than the 45s they were getting
- [x] Hand-check the `jest.useFakeTimers` sites. `shared`'s ScheduledTask suite passes unchanged, so
      vitest's narrower default `toFake` (which leaves `nextTick`/`queueMicrotask` real) is not a
      problem here. `CentralServerConnection.test.js`'s `jest.setTimeout(2000) // fail quickly` was
      inert (jest ignores a setTimeout inside the running test), so it becomes a real per-test timeout
      argument
- [x] Replace `jest-extended` matchers. All 73 `toBeEmpty()` sites are arrays, so `toHaveLength(0)`;
      no local matcher needed. `xit` also went with jest's globals (no vitest equivalent) and becomes
      `it.skip`
- [x] Delete `jest-expect-message`: the `setupFilesAfterEnv` entries, central's `require`, and
      facility's bare import
- [x] Remove deps: `jest`, `@jest/globals`, `@swc/jest`, `jest-expect-message`, `jest-extended`
- [x] Delete `common.jest.config.mjs`, `jest.resolver.cjs`, and the five in-scope `jest.config.mjs`
      files. `packages/mobile/jest.config.js` stays
- [x] Root `npm test` keeps all three runners: `npm run build && vitest run && node scripts/test-all.mjs`,
      with `test-all.mjs` now skipping the vitest packages (they are covered by the root run) and
      walking only mobile, `e2e-tests` and `scripts`. `test-coverage` becomes `vitest run --coverage`,
      since `--` forwarding no longer works through a chained script
- [x] Delete `packages/.new-package`, `scripts/create-package.mjs`, and the root `create-package`
      script entry
- [x] ESLint: `no-restricted-syntax` rule keeping `vi.mock` at the top level of a test file, jest's
      globals narrowed to mobile (so a missing `import { ... } from 'vitest'` is a `no-undef` error
      rather than a runtime failure — this caught 9 files the codemod's detection missed), and the
      TypeScript plugin extended to repo-root `*.config.ts` so `npm run lint-all` still resolves
- [x] Fix what the migration surfaced in central-server (6 files). Each was a difference jest's
      CommonJS compilation hid, not a codemod slip, so each is worth knowing about for the
      release-branch cherry-picks:
      - vitest **errors** on access to an export a mock doesn't declare, where jest gave
        `undefined`. Bit the partial mocks of `app/database` (via the setup file's
        `closeDatabase` read) and of `xlsx` (via `set_fs`); both now spread the real module
      - a mock called with `new` needs a `function` implementation, not an arrow (`cli-table3`,
        and `CentralServerConnection` in four facility suites)
      - `settings.get(models, 'new-database-key')` passed two arguments to a one-argument
        method. Harmless while `es-toolkit`'s CommonJS build tolerated the bad path; the ESM
        build throws
      - two latent races, both timing-dependent rather than newly broken: the FHIR write-log
        retry helper made ten queries in the same millisecond instead of polling, and
        PatientMergeSync's flag-off case was racing the NOTIFY listener that re-stamps a merged
        encounter's child records on another connection. **Worth a second opinion:** the fix
        takes that listener out of the way for that file so each case observes what
        `mergePatient` itself does, since with the listener registered the assertion only holds
        until it catches up
- [x] Collected test-file counts match the pre-migration numbers exactly: central 180, facility
      100, shared 17, settings 6. Full suites green — central 1488 passed, facility 1164 passed,
      plus database 22, upgrade 8, utils and web 51
- [x] Postgres connection limits are fine at `maxWorkers` (peaked around 33 backends on a
      12-core machine, well under the default 100). One thing to know when running locally:
      **two suites must not run at once**, because the per-pool-slot database names collide
      (`<db>-1`..`-N`) and the second run drops the first's database mid-flight. That is what a
      run of `duplicate key ... pg_database_datname_index` errors means
- [ ] After merge, compare CI timings against the baseline above and open a separate CI-time
      optimisation pass if the critical path moved materially

## Adjacent, not in scope

- `chai` is still a devDependency in four packages including the already-migrated `utils`, with 3
  direct import sites. Vitest bundles chai's assertion core
- Turning on `sequence.shuffle`
- Mobile
