# Migrate from jest to vitest for existing test suites

## Why

Jest is the only place in the repo where swc defines **module semantics**. The servers run
`node --import tsx app` with `"type": "module"`, while `@swc/jest` compiles the same source to
CommonJS for tests. The suite therefore validates a build that ships nowhere.

Two lines in `common.jest.config.mjs` exist only to prop that up, with no production counterpart:

- `moduleNameMapper: { '^(\\.{1,2}/.*)\\.js$': '$1' }`, rewriting the repo's `.js`-extension-on-`.ts`
  convention for jest's resolver, which tsx handles natively
- `transformIgnorePatterns` whitelisting `lodash-es`, `es-toolkit`, `@tamanu`, needed only because
  CJS cannot consume ESM-only dependencies

Deleting those two hacks is the deliverable. Vitest's feature set (projects, module-graph watch,
merged coverage, `--typecheck`) is the second motivation.

swc does not leave the repo: `@vitejs/plugin-react-swc` stays in web and patient-portal, `@swc/cli`
in build-tooling and mobile. This card removes `@swc/jest` specifically.

## Starting position

Already on vitest 4: `database`, `utils`, `upgrade`, `web`.

Still on jest: `central-server` (180 test files), `facility-server` (100), `shared` (17),
`settings` (6), `fake-data` (config only, no tests), `mobile` (48), `.new-package` (template).

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
| `jest.mock` / `unmock` | 38 sites, all top-level | codemod, mechanical |
| `requireActual` / `doMock` / `isolateModules` | 25 files (13 central, 10 facility, 2 shared) | hand-work: sync to async restructure |
| `fn` / `spyOn` / `setTimeout` / `clearAllMocks` etc | ~68 files | codemod |
| `@jest/globals` imports | 17 files | module-specifier swap |
| `toBeEmpty` | 73 sites | mostly `expect(errors).toBeEmpty()` on arrays, to `toHaveLength(0)` |
| `toBeTrue` / `toBeFalse` | 4 sites | `toBe(true)` / `toBe(false)` |

All 38 `jest.mock` calls are already at top level, so no restructuring is needed for them. Vitest 5
will throw (v4 warns) on `vi.mock` inside a function, block, or `describe`/`test` callback, so an
ESLint rule should lock that in.

`jest-extended`'s `toBeEmpty` also covers objects, strings and iterables. The 73 sites need a pass
to confirm they are all arrays; stragglers can join the four custom matchers already hand-maintained
in `configureEnvironment.js` (`toBeForbidden`, `toHaveRequestError`, `toBeProblemOfType`,
`toHaveSucceeded`).

## Verification findings

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

**No test-discovery drift.** Verified across all four packages: 180 / 100 / 17 / 6 files match under
both jest's `testRegex` and vitest's default `include`. No files literally named `test.js` or
`spec.ts` (which jest's `/` alternative would match and vitest's glob would not), and nothing under
`app/`, `dist/`, or `__disttests__`, so `testPathIgnorePatterns` is currently a no-op. Post-migration
counts should match exactly, which is a clean assertion for the PR.

**`showSeed` is a no-op today, nothing to port.** The config line is its only reference in the repo:
no `--randomize`, no `randomize: true`, nothing in CI. Jest does not shuffle unless asked, so the
seed printout currently guards nothing. Vitest's counterpart is `sequence.shuffle` +
`sequence.seed`. Turning shuffle on would deliver what the comment intends, but it will surface
order-dependence bugs, so it belongs in a follow-up rather than this card.

**`.new-package` is stale beyond its test config.** It carries `jest.config.mjs`, a `__tests__`
directory, and a `.swcrc`, the last being notable because `common.jest.config.mjs` states "there are
no per-package `.swcrc` files left to locate". Its `package.json` also still describes the
pre-build-less world (`main: dist/cjs/index.js`, `module: dist/mjs/index.js`, `exports` pointing at
`dist`, `build:src` running `swc`) while real packages now use `"exports": { ".": "./src" }`.
`create-package.mjs` just recursively copies the template and rewrites name and version, so all
fixes land in the template. Correcting only its test config leaves a scaffold that is wrong in
bigger ways.

## Project discovery

A bare `projects: ['packages/*']` glob is wrong: vitest treats a globbed directory with no vitest
config as a project **with defaults**, and its default `include` would sweep in `mobile` (48 jest
files), `e2e-tests` (Playwright `*.spec.ts`), and `scripts` (tape tests under `tests/**/*.test.*js`).

Rather than hand-enumerating, derive the list. `plan-ci.mjs` already reads every
`packages/*/package.json`, discovers which have a `test` script, and holds a `SPECIAL_PACKAGES`
exclusion set. The root vitest config would be asking the same question. Export that discovery from
one module and have both `plan-ci.mjs` and `vitest.config.ts` consume it, so a package cannot end up
in CI's matrix but missing from the project list, or the reverse.

## Work

- [ ] Shared discovery module for the project list, consumed by both `vitest.config.ts` and `plan-ci.mjs`
- [ ] Root `vitest.config.ts` with `projects`, plus root-only `coverage` and `reporters`
- [ ] Rewrite `common.jest.config.mjs` as a shared vitest config module (projects do not inherit root
      options unless a project sets `extends: true`, so this stays a shared module rather than
      disappearing into the root config)
- [ ] `shared` + `settings` as a throwaway canary to surface CJS-to-ESM breakage cheaply
- [ ] `VITEST_POOL_ID` in `packages/database/src/services/database.js:89`, replacing `JEST_WORKER_ID`.
      Ids are **1-based in vitest 4** (they were 0-based in v3), and vitest's own migration guide
      names per-worker database names as the thing to update. Use `VITEST_POOL_ID` (bounded by
      `maxWorkers`, slots reused), not `VITEST_WORKER_ID` (monotonic, would create unbounded
      databases). This also un-serialises `packages/database`, which currently runs
      `--no-file-parallelism` because the variable is absent
- [ ] Convert `facility-server` (100 files)
- [ ] Convert `central-server` (180 files)
- [ ] Fold `database`, `utils`, `upgrade`, `web` into projects; drop web's vestigial `globals: true`
- [ ] Port the custom matchers in both `configureEnvironment.js` files
- [ ] Replace `jest-extended` matchers; add a local `toBeEmpty` if any of the 73 sites are not arrays
- [ ] Delete `jest-expect-message` (vitest supports `expect(value, message)` natively; only 6 sites,
      all work unchanged) and its `setupFilesAfterEach` entries
- [ ] Remove deps: `jest`, `@jest/globals`, `@swc/jest`, `jest-expect-message`, `jest-extended`
- [ ] Delete `common.jest.config.mjs` (as jest config) and six `jest.config.mjs` files
- [ ] Delete `scripts/test-all.mjs`; point the root `test` script at vitest
- [ ] Update `.new-package` template
- [ ] ESLint rule keeping `vi.mock` at top level
- [ ] Confirm collected test-file counts match the pre-migration numbers exactly
- [ ] Sanity-check local Postgres connection limits against `maxWorkers`, since central and facility
      now run concurrently in one process where `test-all.mjs` serialised them

## Adjacent, not in scope

- `chai` is still a devDependency in four packages including the already-migrated `utils`, with 3
  direct import sites. Vitest bundles chai's assertion core
- `.new-package`'s pre-build-less `package.json` and `.swcrc`
- Turning on `sequence.shuffle`
- Mobile
