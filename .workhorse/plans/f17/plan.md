# Refresh dependencies within declared ranges at release cut

Every release cut also refreshes `package-lock.json` on main to the newest versions the declared ranges allow. The refreshed lockfile then gets two weeks of use on main and is regression-tested at the next cut, so the lockfile is never more than about three weeks behind: 7 days minimum release age plus a 14-day cycle. Updates that break compatibility stay on the manual 8-weekly cycle.

No spec: this is release tooling, not product behaviour.

## Decisions

- **On main, after the cut.** The release branch is cut first and never carries the refresh. The refresh rides main until the next cut's regression test.
- **Part of the cut-release-branch workflow**, not a separate workflow, pushed straight to main with no pull request. It runs in two jobs after the bump has landed: `refresh-lockfile` resolves and installs without the release PAT (checkout without persisted credentials) and uploads the lockfile; `push-lockfile` holds the PAT and commits it. Freshly resolved packages never run beside credentials that can push to main.
- **Lockfile only, within declared ranges.** `npm update` with no arguments, from the root. `package.json` files don't change, so exact pins and `overrides` hold. Minimum versions only move in the manual cycle.
- **Every workspace, mobile included.** The monorepo has a single lockfile.
- **The 7-day minimum age comes from `.npmrc`** (`min-release-age=7`), which `npm update` honours. No extra logic.
- **`--legacy-peer-deps` on the refresh.** A full re-resolve fails with `ERESOLVE` on mobile's `react-redux@8.0.2`, which peers on React up to 18 while mobile is on React 19. The flag accepts that conflict.
- **Peers are declared explicitly.** `--legacy-peer-deps` drops packages npm installed implicitly as peers. Mobile declares `test-renderer` (peer of `@testing-library/react-native`) and `reactotron-core-client` (peer of `reactotron-redux`). CI's lockfile-peers job fails on any implicitly installed peer, so new ones can't reach main.
- **The refresh is checked against the lockfile it replaces.** `scripts/check-lockfile-peers.mjs --baseline` fails when a required peer that resolved before no longer resolves. This catches a refreshed dependency adding a peer that `--legacy-peer-deps` doesn't install. The 17 required peers already unresolved on main are left alone: mostly React Native libraries hoisted out of reach of mobile's `react-native`, which Metro resolves differently.
- **Its own commit**, after the version bump commit, so it can be reverted on its own. The subject is `chore: Refresh dependencies within declared ranges`. `cliff.toml` skips `chore` commits, so it stays out of release notes.
- **No separate install verification.** `npm update` fails on resolution errors. The `npm install` that follows runs the root `prepare` script, which applies the `@react-pdf/textkit` patch, so a bump that breaks the patch fails there. `npm update` doesn't run root lifecycle scripts, so the follow-up `npm install` is required.
- **A failed refresh never blocks the version bump.** The bump is pushed by the `run` job before the refresh starts. A failed refresh is discarded with a warning annotation.
- **The pinned npm writes the lockfile.** The refresh job installs the `packageManager` npm first, as CI's lockfile check does.
- **A refresh resolved against stale dependency files is dropped.** `push-lockfile` commits onto the current main rather than rebasing. If the lockfile, any `package.json`, `.npmrc` or `patches/` changed on main since the refresh resolved, it is dropped with a warning rather than merged, since nothing would re-resolve the combination. It is not regenerated.

## Steps

- [x] Declare mobile's implicitly installed peers (`test-renderer`, `reactotron-core-client`) and re-place the reactotron packages so no lockfile entry is peer-only
- [x] Add `scripts/check-lockfile-peers.mjs`, and a `lockfile-peers` job in `ci.yml` that runs it and gates `tests-pass`

In `.github/workflows/cut-release-branch.yml`:

- [x] Add a `refresh-lockfile` job after `run`: checkout of main without persisted credentials, the pinned npm, then `npm update --legacy-peer-deps`, `npm install`, the peer check against the previous lockfile, and a check that only the lockfile changed. A refreshed lockfile is uploaded as an artifact; any failure only warns
- [x] Add a `push-lockfile` job, run only when there's a refreshed lockfile: with the PAT, commit it onto the current main, re-run the peer check, and push, retrying on rejection. Drop it with a warning when main's dependency files changed since the refresh resolved
- [x] Leave the version bump's commit and push step as it was
- [x] Confirm that a root `npm update` with no arguments refreshes workspace dependencies as well as the root's, against a scratch copy of the repo
