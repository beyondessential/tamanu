---
name: pre-release-checks
description: >-
  Run Tamanu pre-release verification checks: verify that hotfixes on the current release branch are
  merged forward to main, and that hotfixes from prior release branches are included in the current
  release. Use when the user wants to run "pre-release checks", verify hotfix integrity before cutting
  or shipping a Tamanu release, confirm a release/X.YY branch is safe to release, or check that no
  hotfix has been orphaned (left on neither main nor the current release). Handles Tamanu's train-release
  model (release/X.YY branches vs vX.YY.Z patch tags) and the cherry-pick model where the same logical
  fix has different SHAs on different branches. Purely git-based — no live database or Canopy access
  needed. Not for deciding which tests to run (see scope-tamanu-release-tests).
---

# Run Tamanu pre-release checks

Given a Tamanu release — the current release branch `release/X.YY` (e.g. `release/2.57`, `release/2.59`) — verify **hotfix integrity** before releasing. Two checks and a summary, all reconstructed from the git history. You are working inside a clone of the Tamanu repo, so read the history directly with `git`.

This skill is about **hotfix integrity**, not test scope. Deciding *which* tests to run for a release is a separate concern — use `scope-tamanu-release-tests` for that.

## How Tamanu releases work (read this first)

Tamanu uses a **train-release model**. Each minor version is cut from `main` as a long-lived branch `release/X.YY` (e.g. `release/2.57`). Patch releases (`vX.YY.Z`) are tags/commits on that branch, and hotfixes land directly on the release branch and are then cherry-picked to other lines.

Consequences that matter here:

- **The prior released line is not always `X.(YY-1)`.** Historically `v2.58` was skipped (a regression; it was never released) and its work shipped in the `2.59` line. So "the prior released line" must be determined from which release branches actually shipped, not by decrementing the minor. Always enumerate the real `release/*` branches.
- **Hotfixes are cherry-picked, so the same logical fix has different commit SHAs on different branches.**

## Critical matching rule

**NEVER compare by SHA** — cherry-picked commits always have different SHAs. **ALWAYS match by commit message subject** (the first line), after normalizing away:

- PR-number suffixes (e.g. `(#9939)`)
- per-branch annotations like `(HOTFIX 2.XX)`, `(backport 2.XX)`, `(MAIN)`, `[2.XX]`

A fix counts as **included** if a commit with an **equivalent subject** exists in the target branch.

**Exemptions** — these never need to be merged forward, so filter them out before comparing:

- version-bump commits (`release: Bump version to ...`)
- dependency-update commits

**Caveat — squash merges to main.** Fixes often reach `main` via a squash "merge ... into main" commit that collapses several individual subjects into one. If a subject match fails, do **not** immediately declare the fix missing — verify via the commit's content/date and merge ancestry (`git merge-base --is-ancestor <commit> origin/main`) before concluding it is absent.

## Check 1 — Hotfixes to Main

Every hotfix on the current `release/X.YY` branch must have an equivalent-subject commit on `main`.

Steps:

1. List the commits on `release/X.YY` since its branch point from `main` (`git log --oneline $(git merge-base origin/main origin/release/X.YY)..origin/release/X.YY`).
2. Filter out version-bump and dependency-update commits.
3. For each remaining commit, confirm an equivalent subject exists on `main` — directly, or via a squash merge-to-main (apply the caveat above).

Output status line:

```
Hotfixes to Main: [All merged / N missing]
```

If any are missing, list **only** the missing ones, each with its commit hash and a one-line description.

**Note:** missing-from-main does **not** block the release — the fix is already in the release branch. It is a forward-merge to-do so future release lines don't regress.

## Check 2 — Prior Branch Hotfixes

Hotfixes from prior release branches must be included in the current release.

Steps:

1. Enumerate the prior `release/*` branches (the lines that actually shipped — mind the skipped-`2.58` caveat).
2. For each prior branch, determine its hotfixes and whether an equivalent-subject commit is present in `release/X.YY` — either directly, or inherited via `main`'s base.

**Inclusion rule.** If a prior branch's most recent merge-to-main happened **after** all of that branch's hotfixes **and before** the current release branch was created, then those hotfixes are already inherited via `main`. Verify with:

```
git merge-base --is-ancestor <priorMergeCommit> origin/release/X.YY
```

**The dangerous case:** watch for hotfixes that landed on a prior branch **after** its merge-to-main window. Those are orphaned — on neither `main` nor the new release — and are the single most important thing to catch here.

Output status line:

```
Prior Branch Hotfixes: [All included / N missing from M branches]
```

Only call out branches that **have** missing hotfixes; otherwise just confirm inclusion. For each missing fix, give the hash, a one-line description, and which prior branch it came from.

## Summary

Finish with 1-2 sentences: either ready to release, or action needed — stating concretely what to cherry-pick or forward-merge.

## Output style

- No emojis.
- Be concise — summarise findings; do not list every commit.
- Show the refs/branches you compared as evidence (e.g. `origin/release/2.59` vs `origin/main`, merge-base SHA).

## How to run

```
# Get every release branch and tag locally as origin/* refs
git fetch origin --tags
git fetch origin '+refs/heads/release/*:refs/remotes/origin/release/*'
git branch -r | grep 'origin/release/'          # enumerate the release lines

# Check 1: hotfixes on the current release branch since it diverged from main
base=$(git merge-base origin/main origin/release/X.YY)
git log --oneline --no-merges "$base"..origin/release/X.YY

# Normalize a subject for matching: drop the trailing PR number and branch annotations,
# e.g. strip "(#1234)", "(HOTFIX 2.57)", "(backport 2.57)", "(MAIN)", "[2.57]".
# Then look for the same normalized subject in the target branch's log.
git log --oneline origin/main | grep -iF "<normalized subject>"

# Verify inheritance / presence by ancestry rather than by SHA
git merge-base --is-ancestor <commit> origin/release/X.YY && echo included || echo missing
git merge-base --is-ancestor <priorMergeCommit> origin/release/X.YY
```

## Source of truth

The Tamanu commit history is authoritative. This skill encodes a method, not a fixed answer — branch names, the skipped-version caveat, and annotation conventions can change over time. If the repo disagrees with this skill, the repo wins. Never decide a fix is present or missing from memory of a past release — always read the actual history for the branches in question, and match by subject, never by SHA.
