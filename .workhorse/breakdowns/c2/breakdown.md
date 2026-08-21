# Make TypeScript checking work, then write tests in it

Follow-on work surfaced while migrating to vitest, not leftover scope from it. The migration did
not unblock TypeScript test files — jest already compiled them (`@swc/jest` had a `.tsx?`
transform and `testRegex` matched `[jt]sx?`), and `@tamanu/settings` sat on jest with 53
TypeScript source files and 6 JavaScript test files. What blocks the *useful* version is that
neither runner typechecks, and `tsc` does not currently work anywhere in the workspace: `tsc`
reports 446 errors in `@tamanu/database`, 110 in `@tamanu/settings`, 27 in `@tamanu/upgrade` and
11 in `@tamanu/utils`. `@tamanu/constants` is the only clean one, and it is the only package that
imports no other workspace package — which is the shape of the problem.

Around 85% of those errors are module resolution rather than types: `TS2307` (cannot find module)
dominates every package, and `TS2835`/`TS2834` (relative imports need explicit extensions) account
for most of settings'. Both come from the build-less arrangement, where every workspace package
points its `exports` at extensionless TypeScript source and tsx or Vite completes the path. So the
first entry unblocks the rest, the two error-clearing entries can then run in parallel, and the CI
ratchet wants them done first for whichever packages it gates.

Writing tests in TypeScript is deliberately last and deliberately narrow. It is only worth doing
where the code under test is typed, so it stops at the packages that qualify. Converting the
central and facility suites is not in this set: their `app/` directories are 313 and 191
JavaScript files, so typed tests over them would be `any` at exactly the boundary that matters.
That waits on those servers being TypeScript, which is a far larger piece of work.

## Make TypeScript resolve the workspace's extensionless imports · A3

Get `tsc` to follow the module graph the runtime already follows, without fixing any real type
errors yet. The workspace packages expose extensionless `exports` targets (`{".": "./src"}`) that
TypeScript cannot complete on its own, and relative imports omit extensions too. Settle on an
approach — `moduleResolution: bundler` plus `paths` mappings for `@tamanu/*`, or explicit `types`
targets in each package's `exports` — and apply it in `common.tsconfig.json` so every package
inherits it. Success is the `TS2307`, `TS2835` and `TS2834` counts going to zero everywhere, with
whatever genuine type errors remain left for the entries below. Note that `@tamanu/settings`
overrides `moduleResolution` to `NodeNext` and `strict` to `false` in its own tsconfig, so
reconciling the per-package overrides against the shared config is part of this.

## Clear the type errors in the leaf packages · B3

With resolution working, fix the real type errors in `@tamanu/utils`, `@tamanu/upgrade` and
`@tamanu/settings` so each typechecks clean. The tail is small once the resolution noise is gone:
roughly one error in utils, seven in upgrade, and about thirty in settings, mostly implicit `any`
parameters (`TS7006`) plus a handful of argument and assignment mismatches. Settings also has a
circular mapped type in `ReadSettings` that its current `strict: false` is masking, which is worth
resolving properly rather than suppressing. These three are independent of each other and of the
database entry.

## Clear the type errors in @tamanu/database · C3

Fix the real type errors in `@tamanu/database`, which is by far the largest share: behind its 344
resolution errors sit roughly 70 genuine ones, mostly argument and assignment mismatches
(`TS2345`, `TS2322`) and implicit `any` parameters. It is a separate card from the leaf packages
because of size, not because the work differs — 437 TypeScript source files, and the Sequelize
model layer is where the mismatches concentrate. Expect some to be real latent bugs rather than
annotation gaps, so each wants a judgement about whether to fix the type or the code.

## Run typechecking in CI as a ratchet · D3

Nothing currently runs `tsc` in CI — not one workflow references it, and even mobile's
`typecheck` script is never invoked, so there is nothing stopping the counts climbing again. Add a
job that typechecks the packages that are clean and gate it per package so the rest can opt in as
they go green, rather than blocking on the whole workspace at once. Fold it in alongside the
existing `Lint packages` job or add a sibling, and give each package a consistent script name (the
repo currently has `lint:types` in settings and `typecheck` in mobile).

## Write tests in TypeScript where the source is typed · E3

Convert the test files whose subject is already TypeScript, so the types actually bear on
anything: `@tamanu/settings`' 6 JavaScript test files against 53 typed source files, and the 4
remaining JavaScript files in `@tamanu/database`. Small and mechanical — the runner needs no
change, since vitest already collects `.ts` and the other packages' suites are TypeScript
throughout. Worth doing only after typechecking runs in CI, otherwise the conversion buys editor
inference and nothing enforced. This is also where vitest's `--typecheck` mode and `*.test-d.ts`
become available for type-level assertions, if any are wanted.
