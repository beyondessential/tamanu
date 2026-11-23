---
workhorse-version: 0.8.0
---

# The card's checkout

A card's work happens in a checkout made for that card alone: a git worktree on the card's own branch, cut from the card's base (see `.agents/docs/bases-and-dependencies.md`). Nothing else works in it, so treat it as the card's workspace and yours while you work the card.

## What is expected in it

- Install the repository's dependencies, run its build, lint and tests, and create the files the work needs. These are part of the work, not side effects to avoid.
- A new checkout has nothing installed and nothing built, because it is new. That says nothing about how the user prefers to work, so do not read it as a wish to work without dependencies, builds or tests.
- Take the repository's commands and conventions from its own guidance (`AGENTS.md`, `CLAUDE.md`, contributor docs) and from its existing code.
- For a running copy of the app, lease a rig rather than starting one by hand (see `.agents/docs/browser-rig.md`).
- Stay in the card's checkout. Another card's worktree is not yours to change. Outside Workhorse, work the card in a worktree of its branch (`git worktree add`) rather than switching branches in the user's own working copy.

## Commits in a Workhorse turn

- Describe the commit with `describe_commit` before you write files, in the repository's commit convention, and describe it again if the work changes shape.
- When the turn ends, Workhorse commits whatever the turn changed under the latest description and pushes the card's branch. You do not need to commit or push yourself.
- You may commit on your own where the work wants separate commits, such as one per fixed issue (see `.agents/docs/card-issues.md`) or a loop's commit per item (see `.agents/docs/running-loops.md`). A description given before you committed is discarded once the branch moves, so describe the next commit after each of your own. The turn-end commit then holds only what is still uncommitted, and there is none when nothing is.
- Leave a rebase or merge finished or aborted. While one is under way in the worktree, Workhorse commits nothing at the end of the turn.

## Commits outside a turn

- There is no `describe_commit` and nothing commits for you. Commit your work yourself, with messages in the repository's convention.
- Workhorse sees only what is pushed to the card's branch, so push when the work is ready for others to see.

Opening and merging the card's pull request is Workhorse's (see `.agents/docs/pull-requests.md`).
