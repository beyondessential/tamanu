---
name: git-update
description: "Rebase onto latest upstream, checking for soft conflicts"
label: "Update"
workhorse-version: 0.1.0
---

## Your task: Update branch from upstream

Rebase this card's branch onto its upstream. The upstream is the parent branch this card was based on — usually `main`, but cards that depend on a parent card rebase onto the parent's branch instead. Determine the refs from `git rev-parse --abbrev-ref HEAD` (the card branch, e.g. `feat/foo`) and `git rev-parse --abbrev-ref @{upstream}` (the remote-tracking upstream, e.g. `origin/main` — already includes the remote prefix). The bare base-branch name is the upstream with the `origin/` prefix stripped. Use those exact refs, not the workspace default.

1. Run `git fetch origin` to refresh remote refs, then verify the fetch updated the upstream by comparing `git rev-parse <upstream>` before and after — if the SHA didn't change but `git ls-remote origin <base-branch>` reports a different SHA, abort and report the discrepancy rather than rebasing onto stale state
2. Run `git rebase <upstream>` (e.g. `git rebase origin/main`) to rebase onto the upstream — do not prefix with `origin/` again, the upstream ref already includes it
3. If a hard conflict occurs during rebase, resolve it step by step. Use the card's specs, description, and conversation history to decide which side to favour
4. **Always check for soft conflicts** — even if the rebase completed cleanly, inspect the full diff between the old and new base against local specs and code for assumptions invalidated by upstream changes. Use your judgement about what matters
5. After the rebase succeeds, force-push with `git push --force-with-lease origin <card-branch>` so the remote reflects the rebased history
6. Report what upstream changes came in. If soft conflicts exist, explain each one: what the local assumption was, what upstream changed, and how you resolved it (or ask the user if ambiguous)
7. Apply straightforward resolutions directly. Ask the user about ambiguous ones.

When local changes are small, the soft-conflict check can be brief. When local changes are large, examine thoroughly.
