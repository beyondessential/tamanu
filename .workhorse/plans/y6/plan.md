# Migrate mobile test suite to vitest — exploration

Findings from scoping what the migration takes. Mobile was deliberately left on
jest by the repo-wide migration (dd80ca4dfb), citing Flow-typed React Native
source that vite cannot parse and Metro-matching test compilation. This plan
records what those blockers look like in detail and the candidate approaches.

## Current state

- 51 test files: ~32 logic suites (`App/models`, `App/services`, `App/infra`,
  `App/ui/helpers`, SurveyForm calculations) and 19 component suites (`.tsx`)
  rendering with `@testing-library/react-native`. No snapshot files.
- `jest.config.js` on `@react-native/jest-preset`, with a dual transform:
  babel-jest for `.js`, ts-jest for `.ts/.tsx` (diagnostics warnOnly). Two
  sub-configs split `*.spec` (unit) from `*.test` (integration) — both run in
  plain `npm test`.
- `jest.setup.ts` + 9 local `__mocks__` files, all written against the `jest`
  global; 35 files use `jest.*` APIs.
- Model/db tests run TypeORM against real sqlite (`synchronize: true`), with a
  per-worker DB path keyed on `JEST_WORKER_ID`.
- ESLint carves jest globals out for mobile only (`eslint.config.js:114`).
- Mobile auto-joins the root vitest `projects` list the moment it gains a
  `vitest.config.ts` (`scripts/vitestProjects.mjs` globs for it).

## The blockers, verified

1. **React Native still ships Flow-typed source.** Confirmed on RN 0.85.3
   (`Libraries/Core/InitializeCore.js` carries `@flow strict-local`). Vite's
   esbuild cannot parse Flow, so every import that reaches `react-native/*` (or
   the RN ecosystem packages in the current `transformIgnorePatterns`
   whitelist) needs a babel transform inside the vite pipeline — a plugin
   running `@react-native/babel-preset` over those files.
2. **`@react-native/jest-preset` has no vitest equivalent.** Its setup mocks
   ~20 RN internals (`NativeModules`, `View`, `Text`, `TextInput`,
   `ScrollView`, `Image`, `Modal`, `UIManager`, `NativeComponentRegistry`,
   `RendererProxy`, `AppState`, etc.) plus globals (`__DEV__`,
   `requestAnimationFrame`, `performance.now`, `IS_REACT_ACT_ENVIRONMENT`), a
   custom test environment, an asset transformer, and haste platform-extension
   resolution. All of that would be hand-ported to `vi.mock` + a vitest setup
   file. The RN mock files themselves are Flow-typed, so the babel transform
   must cover them too. (Haste barely matters to us: one `.android.tsx` file
   in App, handled by `resolve.extensions`.)
3. **TypeORM decorator metadata.** `tsconfig.json` sets
   `emitDecoratorMetadata`; 12 no-arg `@Column()` sites rely on `design:type`.
   esbuild never emits it — the app-code transform must be babel (the existing
   `babel.config.js` already has `babel-plugin-transform-typescript-metadata` +
   legacy decorators) or swc.
4. **Testing Library for RN is jest-first.** Officially "tested to work with
   Jest… should work with other test runners"; its built-in matchers extend
   `expect`, and `userEvent` has known fake-timer detection issues off the
   `jest` global. This is the main risk pocket, concentrated in the 19
   component suites. The community bridge `vitest-react-native` is WIP, last
   published Jan 2024 — not viable against vitest 4 + RN 0.85.
5. **Third-party jest-flavoured mocks.** `@react-native-async-storage/…/jest`
   uses `jest.fn` internally; needs a `globalThis.jest = vi` shim or a
   hand-written replacement. Same class of issue for keychain/device-info
   mocks currently in `jest.setup.ts`/`__mocks__`.

## Candidate approaches

**A. Full migration, babel-based pipeline.** One vite transform plugin runs
babel (metro preset for RN packages, the package's own `babel.config.js` for
App code) so test compilation still matches what Metro ships — which answers
the "tests should compile like production" argument for staying on jest.
Port the RN preset mocks and local mocks to `vi.mock`, convert 35 files'
`jest.*` → `vi.*`, alias map → `resolve.alias`, `JEST_WORKER_ID` →
`VITEST_POOL_ID`, share `common.vitest.config.mjs`, drop
jest/ts-jest/babel-jest deps, flip the ESLint carve-out. Largest surface;
the RNTL suites are the part that may simply not work well.

**B. Phased: logic suites first.** The 32 logic suites' layers only import
`AppState` and `DevSettings` from `react-native` — a slim alias stub covers
them, no Flow transform or RN preset port needed. Component suites stay on a
trimmed jest until RNTL/vitest matures. Cheapest path to mostly-vitest, but
leaves two runners in one package, which is likely what this card wants to
eliminate.

**C. Defer.** RN is migrating its internals from Flow to TypeScript; when it
ships non-Flow source, blocker 1 (and much of 2) shrinks substantially.

## Suggested first step

Spike approach A's pipeline on two files before committing to it: one model
suite (proves babel transform + decorator metadata + sqlite per-worker) and
one RNTL component suite (proves the ported RN mocks + RNTL-under-vitest).
The component spike is the go/no-go signal between A and B.
