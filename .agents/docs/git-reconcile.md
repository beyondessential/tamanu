---
workhorse-version: 0.8.0
---

# Reconciling a branch

The Pull, Update and Rebase skills each bring a branch up to date with something that moved: its own remote, its base, or a merge. Each skill gives its own steps; these rules apply to all of them.

## Hold the pull request on a card's branch

Call `hold_pr` with a short reason, such as "Updating the branch from main", before you touch a card's branch. Your own turn already holds, but a turn that ends part-way through leaves nothing holding, and an armed merge would fire on a branch that is not ready. Call `release_pr` once the push has landed, and only then: work that stops short, because you need an answer or the user has redirected you, leaves the branch held, which is released from the PR section or lapses. Where the tools are not available, carry on without them. See `.agents/docs/pull-requests.md` for holds outside a turn.

## Check the fetch

Run `git fetch origin`, and check it moved the ref you are about to use by comparing `git rev-parse origin/<branch>` before and after. If it did not change but `git ls-remote origin <branch>` reports a different sha, stop and report the discrepancy rather than working from stale state.

## Rebase or merge

A branch that holds merge commits of its own is brought up by merging, not rebasing: a rebase flattens those merges into copies of the merged work, and a parent card acting as an epic holds one for each card that merged into it. Run `git rev-list --merges origin/<base>..HEAD`: if it prints nothing, rebase; if it prints any commit, merge. When pulling with rebase, use `git pull --rebase=merges` so merge commits are kept.

## Conflicts

- **Hard conflicts:** resolve them one at a time. On a card, use its specs, description and conversation to decide which side to favour. Where the two sides cannot be reconciled, say so rather than guess.
- **Soft conflicts:** always look for them, even when git finished cleanly. Read what came in against the local specs, code and docs for assumptions it has made wrong. Keep the check brief when the local changes are small, and thorough when they are large.
- Apply straightforward resolutions yourself. Ask the user about ambiguous ones.
- A rebase that cannot be saved is aborted (`git rebase --abort`) and explained, never left part-way.

## Push

After a rebase, push with `git push --force-with-lease origin <branch>`, never a bare `--force`. After a merge, push with plain `git push origin <branch>`: nothing already pushed was rewritten.

## Report

Say what came in, and whether you rebased or merged. For each soft conflict, say what the local work assumed, what the incoming change did, and how you resolved it, or ask.
