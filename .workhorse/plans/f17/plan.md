# Refresh dependencies within declared ranges at release cut

Every release cut also refreshes `package-lock.json` on main to the newest versions the declared ranges allow. The refreshed lockfile then gets two weeks of use on main and is regression-tested at the next cut, so the lockfile is never more than about three weeks behind: 7 days minimum release age plus a 14-day cycle. Updates that break compatibility stay on the manual 8-weekly cycle.

No spec: this is release tooling, not product behaviour.

## Decisions

- **On main, after the cut.** The release branch is cut first and never carries the refresh. The refresh rides main until the next cut's regression test.
- **Part of the cut-release-branch workflow**, not a separate workflow. It is pushed to main by the same push step as the version bump, with no pull request.
- **Lockfile only, within declared ranges.** `npm update` with no arguments, from the root. `package.json` files don't change, so exact pins and `overrides` hold. Minimum versions only move in the manual cycle.
- **Every workspace, mobile included.** The monorepo has a single lockfile.
- **The 7-day minimum age comes from `.npmrc`** (`min-release-age=7`), which `npm update` honours. No extra logic.
- **Its own commit**, after the version bump commit, so it can be reverted on its own. The subject is `chore: Refresh dependencies within declared ranges`. `cliff.toml` skips `chore` commits, so it stays out of release notes.
- **No separate verification step.** `npm update` fails on resolution errors. The `npm install` that follows runs the root `prepare` script, which applies the `@react-pdf/textkit` patch, so a bump that breaks the patch fails there. `npm update` doesn't run root lifecycle scripts, so the follow-up `npm install` is required.
- **A failed refresh never blocks the version bump.** If the refresh fails, it's discarded with a warning annotation and the bump is pushed alone. A failed bump would leave main un-bumped and trip the "already exists" guard on the next run.
- **A lockfile conflict while retrying the push drops the refresh.** If a rebase in the push retry loop conflicts on the refresh commit, the rebase is aborted, the refresh commit is dropped with a warning, and the bump is retried alone. The refresh is not regenerated mid-retry.

## Steps

In `.github/workflows/cut-release-branch.yml`:

- [ ] Split the "Commit and push" step into "Commit version bump" (the `git commit -am`) and "Push to main" (the retry loop), so the refresh can sit between them
- [ ] Add a "Refresh dependencies within declared ranges" step between them: `npm update`, then `npm install`, then commit the lockfile alone. On any failure, `git reset --hard` to the bump commit and emit a `::warning::` annotation. The step itself succeeds either way
- [ ] Skip the refresh commit when `npm update` leaves the lockfile unchanged (no `--allow-empty`)
- [ ] In the push retry loop, when `git pull --rebase` conflicts: abort, drop the refresh commit if present (with a `::warning::`), and retry with the bump alone. A conflict on the bump itself still fails as it does today
- [ ] Confirm that a root `npm update` with no arguments refreshes workspace dependencies as well as the root's, against a scratch copy of the repo
- [ ] Update the workflow's comments where the step split changes what they describe (the "release branch is already pushed" note on the push loop)
