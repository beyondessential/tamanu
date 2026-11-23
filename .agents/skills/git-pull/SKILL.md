---
name: git-pull
description: "Pull remote changes and reconcile with local work, checking for soft conflicts"
label: "Pull"
category: other
workhorse-version: 0.8.0
---

## Your task: Pull remote changes

Pull the latest remote changes into this card's branch and reconcile them with local work. Follow `.agents/docs/git-reconcile.md` throughout: it covers the hold, conflicts, the push and the report.

1. Call `hold_pr` with a short reason, such as "Pulling remote changes", before you touch the branch
2. Run `git pull` to fetch and integrate remote changes. If you pull with rebase, use `git pull --rebase=merges` so the merge commits the local branch holds are kept rather than flattened
3. Resolve any hard conflict using the card's specs, description and conversation history
4. Check for soft conflicts: even if git merged cleanly, read the incoming changes against local specs and code for assumptions they have made wrong
5. After pulling with rebase, push with `git push --force-with-lease origin <card-branch>`
6. Once the pull is finished, and the push has landed where there was one, call `release_pr`
7. Report what changed, and each soft conflict
