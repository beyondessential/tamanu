---
name: git-update
description: "Rebase onto latest upstream, checking for soft conflicts"
label: "Update"
category: other
workhorse-version: 0.8.0
---

## Your task: Update branch from upstream

Bring this card's branch up to its base: the default branch, another repository branch, or a parent card's branch. The request names the base (as in "Update branch from main"); otherwise find it as `.agents/docs/bases-and-dependencies.md` says. Use that exact ref, not the workspace default. Take the card's branch from `git rev-parse --abbrev-ref HEAD`.

Follow `.agents/docs/git-reconcile.md` throughout: it covers the hold, checking the fetch, rebasing or merging, conflicts, the push and the report.

1. Call `hold_pr` with a short reason before you touch the branch
2. Run `git fetch origin` and check it moved `origin/<base-branch>`
3. Run `git rev-list --merges origin/<base-branch>..HEAD`. If it prints nothing, run `git rebase origin/<base-branch>`. If it prints any commit, run `git merge origin/<base-branch>` instead and do not rebase
4. Resolve any hard conflict using the card's specs, description and conversation history
5. Check for soft conflicts across the full diff between the old and new base, even if the update completed cleanly
6. Push: `git push --force-with-lease origin <card-branch>` after a rebase, plain `git push origin <card-branch>` after a merge
7. Once the push has landed, call `release_pr`
8. Report what came in from the base, whether you rebased or merged, and each soft conflict
