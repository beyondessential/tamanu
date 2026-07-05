---
name: cherry-pick-changes
description: "Cherry-pick post-merge commits onto a new follow-up branch"
label: "Cherry-pick changes"
workhorse-version: 0.1.0
---

## Your task: Cherry-pick post-merge changes

The card just created a follow-up PR on a fresh branch from main. Your job is to cherry-pick the post-merge commits from the previous branch onto this new branch.

The user message contains the previous branch name and the commit SHAs to cherry-pick.

1. Cherry-pick each commit in order using `git cherry-pick <sha>`
2. If a cherry-pick applies cleanly, move to the next one
3. If a cherry-pick encounters conflicts:
   - Examine the conflict markers to understand what diverged
   - Use the card's specs, description, and conversation history to make informed resolution decisions
   - Edit the conflicted files to resolve them
   - `git add` the resolved files
   - `git cherry-pick --continue` to proceed
4. After all commits are applied, push the branch with `git push origin <branch>`
5. Report what you cherry-picked, any conflicts you encountered, and how you resolved them
