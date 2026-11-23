---
workhorse-version: 0.8.0
---

# Bases and dependencies

A card's base is the one ref its branch is cut from, kept up to date with, diffed against, and merged into. The card shows it as **Based on**. It is one of:

- **The repository's default branch**, the usual case.
- **Another branch of the repository**, such as a release branch. The card keeps it for its whole life and merges into it, so treat it as the card's intent, not a mistake to correct back to the default branch.
- **One parent card's branch.** The card then depends on the parent: it builds on the parent's specs and code, sees the parent's draft specs, cannot move past the parent's status, and cannot open a pull request before the parent has one. When the parent merges, the card's base becomes the parent's own base.

The base is set from the Based on picker, from a project's default base when a card is created, or from a breakdown's base setting for the cards it spawns.

## Finding the base

- In a Workhorse turn, the card's context names a parent card or a repository branch when the base is one. Otherwise the base is the repository's default branch. A request to update the branch names the base it updates from.
- Outside a turn, `get_card` on the Workhorse MCP reports the card's dependencies and branch. For a parent card, its branch is on `get_card` for that card; if the parent has merged, use the parent's own base.
- Do not take `@{upstream}` as the base. Once the card's branch has been pushed, it tracks the card's own branch on the remote, not its base.

## Diffing against the base

- What the card changed is its branch against the merge base with its base: `git fetch origin`, then `git diff origin/<base>...HEAD` for committed work, plus anything uncommitted in the worktree.
- Never assume the default branch. On a card based on a parent, a diff against the default branch takes in the parent's work as well.

## Keeping up with the base

- The Update skill brings the branch up to its base, rebasing it, or merging the base in when the branch holds merge commits of its own (see `.agents/docs/git-reconcile.md`).
- A parent card acting as an epic holds a merge commit for each card that merged into it, so it takes its base by merging rather than rebasing.
