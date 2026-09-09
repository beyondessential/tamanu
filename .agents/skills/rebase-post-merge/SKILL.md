---
name: rebase-post-merge
description: "Rebase the branch past a merge so a follow-up PR carries only new work"
label: "Rebase"
workhorse-version: 0.3.0
---

## Your task: rebase past the merge

This card's previous PR was merged, and a follow-up PR is now open on the same branch. The branch
still carries the commits that PR merged, so the follow-up's diff replays work that has already
landed. Your job is to drop those commits and leave only the work done since.

Workhorse tried this automatically and hit conflicts, which is why you have it.

The user message names the base branch and the merged PR's number.

1. `git fetch origin` to refresh remote refs
2. Get the merged PR's head commit: `gh pr view <number> --json headRefOid -q .headRefOid`. That
   commit is the last one the merge covered, so everything up to and including it is already on the
   base branch
3. `git rebase --onto origin/<base-branch> <that-sha>` — this drops the merged commits by range
   rather than replaying them, which is what keeps the rebase clean. Do NOT use a plain
   `git rebase origin/<base-branch>`: it replays the already-merged commits and conflicts against
   the squashed form of the branch's own work
4. Resolve any conflicts as they come. These are against genuine upstream changes, so use the
   card's specs, description, and conversation history to decide which side to favour. `git add`
   the resolved files and `git rebase --continue`
5. Force-push with `git push --force-with-lease origin <branch>`
6. **Check for soft conflicts** — the branch now sits on newer upstream code, so inspect the diff
   against local specs and code for assumptions the upstream changes invalidated. Use your
   judgement about what matters
7. Report what the branch now contains, any conflicts you resolved and how, and any soft conflicts
   you found

If the rebase turns out to be unsalvageable, `git rebase --abort` and explain what blocked it
rather than leaving the branch mid-rebase.
