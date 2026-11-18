# Test cases: dependency refresh at release cut

Run the cut-release-branch workflow against a fork, or replay its steps locally against a scratch clone of main.

## Refresh

- [ ] A dependency with a newer in-range version published more than 7 days ago moves to it in `package-lock.json`
- [ ] A version published less than 7 days ago is not taken, even when in range
- [x] No `package.json` changes in the refresh commit
- [x] Exact pins (e.g. `@playwright/test`) and `overrides` entries (e.g. `react-redux`, `@mui/material`) resolve to the same versions as before
- [x] Dependencies of workspaces, including `packages/mobile`, are refreshed, not just the root's
- [ ] The `@react-pdf/textkit` patch still applies after the refresh
- [x] The refresh gets past mobile's `react-redux` / React 19 peer conflict
- [x] The refresh drops no peer that resolved before it

## Lockfile peer check

- [x] CI fails when a lockfile package is installed only as an implicit peer
- [x] CI passes on main's lockfile once mobile declares its peers
- [x] Against a baseline, the check fails when a required peer no longer resolves, and ignores optional peers and packages that only moved in the tree

## Commits and branches

- [ ] The refresh is its own commit on main, after `release: Bump version to …`
- [ ] The lockfile is written by the `packageManager` npm, so CI's lockfile check passes on main after the refresh
- [ ] The new release branch carries no refresh commit
- [x] When nothing is out of date, no refresh commit is made and the bump is pushed as before

## Failure handling

- [x] A refresh that fails in `npm update` (e.g. a forced resolution conflict) leaves a warning annotation, and the bump is pushed alone
- [ ] A refresh that fails in `npm install` (e.g. the patch no longer applies) leaves a warning annotation, and the bump is pushed alone
- [x] A refresh that changes anything besides the lockfile is discarded with a warning
- [x] When main moved without touching dependency files, the refresh is committed on top of it and pushed
- [x] When main's lockfile changed since the refresh resolved, the refresh is dropped with a warning
- [ ] The refresh job has no credential that can push: its checkout persists none and no secret reaches it
