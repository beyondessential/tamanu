---
name: release-cutoff-checks
description: >-
  Run the Tamanu release-branch CUTOFF checks when preparing to cut a new release/X.YY branch: confirm
  the previous release's hotfixes are merged to main, reconcile the commits since the previous release
  against the "Merged to main" card list from Linear, and scan for data/reporting/schema changes. Use
  when the user is cutting a Tamanu release and wants to verify the codebase is ready, wants to check
  main against the previous release branch, or wants to reconcile commits with a Linear "Merged to main"
  column (they should paste the card list). Handles Tamanu's train-release model (release/X.YY branches
  vs vX.YY.Z patch tags) and the cherry-pick model where the same logical fix has different SHAs on
  different branches. Purely git-based — no live database or Canopy access needed. Not for verifying an
  existing release branch's hotfix integrity (see pre-release-checks) or for deciding which tests to run
  (see scope-tamanu-release-tests).
---

# Run Tamanu release cutoff checks

Help with the Tamanu release **cutoff** process: the user is about to cut a new release branch and
needs to verify `main` is ready. You are working inside a clone of the Tamanu repo, so read the
history directly with `git`. Three checks plus a summary.

## How Tamanu releases work (read this first)

Tamanu uses `release/X.YY` branches (e.g. `release/2.46`, `release/2.47`) cut from `main`. Hotfixes
land on a release branch and are cherry-picked between branches.

## Critical matching rule

**NEVER compare by SHA** — cherry-picked commits always have different SHAs. **ALWAYS match by commit
message subject** (the first line). A hotfix is "merged to main" if a commit with the same subject
exists on `main`, regardless of SHA. Search far enough back (at least 50-100 commits) — cherry-picks
are not always recent (`git log --oneline -100 main`, then search for matching subject text).

## Check 1 — Previous Release Hotfixes Merged to Main

Ensure every hotfix from the previous release branch has been merged into `main`.

1. List the commits on the previous release branch that are hotfixes (after the initial release).
2. For each hotfix, search `main` for a commit with the same message subject.
3. Only flag as "needs merging" if **no** equivalent commit exists on `main`.
4. Any truly unmerged hotfixes need a PR (using the "third branch" technique).

## Check 2 — Verify "Merged to main" Column Matches Commits

The user provides the list (or a screenshot) of cards in the **"Merged to main"** column from the
Linear board. Reconcile it against the commit history both ways:

- Diff `main` against the previous release branch. Check that **every commit** in the diff has an
  associated card in "Merged to main", or is obviously a no-ticket commit (version bumps, dependency
  updates).
- Vice-versa: check that **every ticket** in "Merged to main" has an associated commit.

If the user has not supplied the card list, you can still list the commits since the previous release
with their ticket references, and note that a full reconciliation needs the card list.

## Check 3 — Data Reporting Changes

Compile the changes relevant to data reporting by checking for:

- changes to models (schema changes, new fields, renamed fields)
- changes to constants that affect reporting
- new or modified reports

## Output format

```
## Release Cutoff Check

### Previous Release Hotfixes
[Status: All merged to main / N commits need merging]
[If any need merging, list them with commit hash and message]

### Commit/Ticket Reconciliation
[Can only verify commits exist — user must provide ticket list for full reconciliation]
[List commits since previous release with their ticket references]

### Data Reporting Changes
[List any model, constant, or report changes that affect data reporting]
[If none: "No data reporting changes identified"]

### Summary
[1-2 sentence assessment of release readiness from a code perspective]
```

## Output style

- No emojis.
- Be concise — summarise findings.
- Show the refs/branches you compared as evidence.

## Source of truth

The Tamanu commit history is authoritative. This skill encodes a method, not a fixed answer — branch
names and reporting-relevant paths can change over time. If the repo disagrees with this skill, the
repo wins. Never decide a fix is present or missing from memory of a past release — always read the
actual history, and match by subject, never by SHA.
