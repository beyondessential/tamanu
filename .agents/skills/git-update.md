---
label: "Update"
workhorse-version: 0.1.0
---

## Your task: Update branch from upstream

Rebase this card's branch onto its upstream. The upstream for this card is **`<base-branch>`** — use exactly this branch, not the workspace default. Cards that depend on a parent card rebase onto the parent's branch, not main.

1. Record the current upstream SHA with `git rev-parse origin/<base-branch>`, then run `git fetch origin` to refresh remote refs and re-read the SHA — if the SHA didn't change but `git ls-remote origin <base-branch>` reports a different SHA, abort and report the discrepancy rather than rebasing onto stale state
2. Run `git rebase origin/<base-branch>` to rebase onto the upstream
3. If a hard conflict occurs during rebase, resolve it step by step. Use the card's specs, description, and conversation history to decide which side to favour
4. **Always check for soft conflicts** — even if the rebase completed cleanly, inspect the full diff between the old and new base against local specs and code for assumptions invalidated by upstream changes. Use your judgement about what matters
5. After the rebase succeeds, force-push with `git push --force-with-lease origin <card-branch>` so the remote reflects the rebased history
6. Report what upstream changes came in. If soft conflicts exist, explain each one: what the local assumption was, what upstream changed, and how you resolved it (or ask the user if ambiguous)
7. Apply straightforward resolutions directly. Ask the user about ambiguous ones.

When local changes are small, the soft-conflict check can be brief. When local changes are large, examine thoroughly.
