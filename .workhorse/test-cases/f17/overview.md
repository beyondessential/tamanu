# Test cases: dependency refresh at release cut

Run the cut-release-branch workflow against a fork, or replay its steps locally against a scratch clone of main.

## Refresh

- [ ] A dependency with a newer in-range version published more than 7 days ago moves to it in `package-lock.json`
- [ ] A version published less than 7 days ago is not taken, even when in range
- [ ] No `package.json` changes in the refresh commit
- [ ] Exact pins (e.g. `@playwright/test`) and `overrides` entries (e.g. `react-redux`, `@mui/material`) resolve to the same versions as before
- [ ] Dependencies of workspaces, including `packages/mobile`, are refreshed, not just the root's
- [ ] The `@react-pdf/textkit` patch still applies after the refresh

## Commits and branches

- [ ] The refresh is its own commit on main, after `release: Bump version to …`
- [ ] The new release branch carries no refresh commit
- [ ] When nothing is out of date, no refresh commit is made and the bump is pushed as before

## Failure handling

- [ ] A refresh that fails in `npm update` (e.g. a forced resolution conflict) leaves a warning annotation, and the bump is pushed alone
- [ ] A refresh that fails in `npm install` (e.g. the patch no longer applies) leaves a warning annotation, and the bump is pushed alone
- [ ] A push rejected because main moved, with no lockfile conflict, rebases and pushes both commits
- [ ] A push rejected because main changed `package-lock.json` drops the refresh commit with a warning and pushes the bump alone
