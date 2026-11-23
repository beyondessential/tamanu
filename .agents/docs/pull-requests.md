---
workhorse-version: 0.8.0
---

# The card's pull request

Workhorse opens, titles, reviews and merges the card's pull request. Your part is to push the work and keep the card's PR title right.

## Opening

- Workhorse opens the pull request from the card's PR section, against the card's base, with the card's PR title and the repository's pull request template, and fills the body from what the branch carries. After a merge, later work on the card goes out in a follow-up pull request (see [After a merge](#after-a-merge-follow-up-pull-requests)).
- Never open a pull request yourself: no `gh pr create` and no GitHub API call, for the card's branch or any side branch. Push, and say the branch is ready.

## The title

- The pull request opens with the card's PR title as it stands, so set it before then with `set_pr_title`, and revise it as the work takes shape.
- Write it to the repository's own PR-title convention, read from its contributor and agent guidance, with the card's identifier or linked ticket code where the convention puts one.
- Read it with `get_pr_title`. A title the user set stays as it is unless they ask you to change it.
- Once the pull request is open, a title set with the tool is applied to it on GitHub.

## Reviews

- Review Hero reviews the pull request from GitHub Actions. The card's Rerun until clean automation requests its rounds and hands each round to the agent to address.
- A repository's Review Hero can post its findings to Workhorse and leave them off the pull request. A round's findings are then among the card's issues, not the pull request's comments. Read them with `read_issues` (see `.agents/docs/card-issues.md`), and tell the user that is where they are.
- A pull request with no review comments is not a clean review. Check the card's issues before saying it is.
- Comments from other reviewers on the pull request reach the card as issues too.

## Merging

- Workhorse merges, from the merge button or a scheduled merge, by whatever method the repository allows for the base. Before it merges, it strips the card scratch from the branch (see `.agents/docs/card-artefacts.md`).
- Leave merging to Workhorse. A skill made for working outside Workhorse, such as Run Review Hero, says how to merge by hand where it has to.

## After a merge: follow-up pull requests

A card can carry several pull requests over its life, one at a time. Merging one does not end the card: work that goes on afterwards becomes the card's next pull request, and Workhorse handles the branches for it.

- **Keep committing on the card's branch as it stands.** Commits on top of the merged pull request's head are the follow-up's work. Do not cut a branch of your own, rebase onto the base, or merge the base in to get ready for the next pull request.
- **The branch conflicts with its base, and that is expected.** A squash or rebase merge put the branch's work on the base as different commits, so the branch's own copies conflict with them. Workhorse does not report this conflict, and the follow-up never replays those commits, so leave it alone.
- **The user opens the follow-up with Create New PR.** Workhorse cuts a fresh branch from the card's tip, named from the card's branch and its pull request count (`workhorse/s5` becomes `workhorse/s5-2`, then `workhorse/s5-3`), rebases it onto the base with the merged commits dropped, pushes it and opens the pull request. The card moves onto the new branch, and the old one stays where it was, with the merged pull request's history intact.
- **If that rebase meets a conflict, Workhorse hands it to you** as a request to rebase past the merge (the Rebase post-merge skill). Nothing has been published at that point: rebase the card's own branch, dropping the merged commits as a range, and force-push with `--force-with-lease`. The user then takes Create New PR again. Where the base already holds the merged head, as a merge commit leaves it, there is nothing to drop; say so rather than rebasing.
- **After the move, the card's branch is the new one.** Read the branch from the checkout (`git branch --show-current`) or from the card, not from memory. A merged pull request is finished, and pushing to its old branch changes nothing that will merge.
- **The PR title is cleared when a pull request merges.** Set a new one for the follow-up's own work with `set_pr_title`. The follow-up's description covers only the work since the merge, and names the pull request it follows.
- **New branch from upstream starts over instead.** Offered after a merge with nothing on top of it, or after a close, it puts the card on a fresh branch from the base, and the next pull request is an ordinary first one.
- **A pull request closed without merging** leaves its commits on the card's branch. Create PR opens a fresh pull request from that same branch, covering them.

## Holds

A hold says work on the branch is part-way through. While one is on, Rerun until clean requests no review round and an armed merge does not fire.

- A Workhorse turn holds for its length, and a loop run holds for its own length, so you never hold for either.
- For work that runs over several turns before the branch is worth reviewing again, such as an update that may stop on a question or fixes from a review, call `hold_pr` with a short reason as you start, and `release_pr` once the last of it is pushed. A hold left behind is released once its conversation has been idle for a while, or from the PR section.
- Outside a turn, `hold_pr` and `release_pr` are on the Workhorse MCP and take the card. The hold belongs to you: to your device at the local endpoint, or to you as a person at the remote one. Run `workhorse-local keep-alive <card>` in the background while the work goes on. It renews the hold, and exits once you release it or the hold has been lifted; if it says the hold was lifted and the work goes on, take it again. A hold never kept alive lapses after a while with no call about the card and no push to its branch.
- Where neither the tools nor the MCP are available, carry on without a hold.
