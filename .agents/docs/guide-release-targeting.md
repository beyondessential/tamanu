# Guide release targeting

Which branch a user guide or configuration guide's pull request targets, and how the guide gets there
and onwards. The `draft-user-guide` and `draft-config-guide` skills follow it; follow it too when
raising a guide by hand.

A guide is raised against the release branch it documents, so a deployment's guides match the version
it runs. Release branches are `release/2.xx` (see `llm/project-rules/release-branches.md`).

## Choosing the target

**Ask the author which release the guides are for**, in the scope review, and use their answer. Fetch
the release branches first and list them, so a newly cut one is offered.

A run's guides go to one release, so ask once for the run. `release/2.68` is the first branch carrying
`docs/user-manuals/`, and main is the answer for a guide documenting something no release has yet.

Say so and ask again if the answer turns out not to hold: the release lacks a feature the guides
document, or a guide being updated does not exist on it.

## Grounding in the target

Once the target is a release branch, read **that branch's code**, not main's, for everything the guide
states: labels, flows, settings, permissions, reference data. A detached worktree outside the
repository is the easiest way to read it, removed once the guide is written:

```bash
git worktree add --detach /tmp/tamanu-release-2.68 origin/release/2.68
# ... read and grep there ...
git worktree remove /tmp/tamanu-release-2.68
```

A demo site used to click the flow through or capture screenshots must run the target version.

## Landing the pull request

Open the pull request with the release branch as its base, rebasing the guide commits onto it first
(`git rebase --onto origin/release/2.xx "$(git merge-base HEAD origin/main)"`), since a branch cut
from main carries commits the release does not. Expect conflicts, and resolve them as in
[Resolving conflicts](#resolving-conflicts). The rebase rewrites history, so an open pull request
needs a force-push with lease and its base changed on GitHub.

## Carrying it forward

When the target is a release branch, prepare in the same run a branch for **each newer release branch
and for main**, carrying the guides' commits cherry-picked with their subjects unchanged. Name it for
the card and what it carries, ending in its base: `chore/{card-code}/vitals-user-guides-to-main`,
`chore/{card-code}/vitals-user-guides-to-2.69`. Build each in a temporary worktree, so the card's
own worktree is untouched:

```bash
git worktree add -b chore/{card-code}/vitals-user-guides-to-main /tmp/tamanu-forward-main origin/main
git -C /tmp/tamanu-forward-main cherry-pick <first>^..<last>
git worktree remove /tmp/tamanu-forward-main
```

Resolve conflicts the same way. The author pushes each branch and raises its pull request against its
base.

## Resolving conflicts

- **The run's guides**, rebasing onto the target, take the run's version in full
  (`git checkout --theirs -- <guide>` while the rebase is stopped). The run verified the whole guide
  against the target, so its version is what the target should carry
- **The run's guides, cherry-picking forward**, keep what that branch has and take only the run's own
  changes on top. A newer branch may have edited the guide since the card branch was cut, and
  `--theirs` would discard that edit. Read the run's change (`git show <commit> -- <guide>`) and the
  branch's (`git log <merge-base>..<branch> -- <guide>`), and resolve the conflict so the guide holds
  both. Where the two change the same words, the run's wording wins, since it was verified against
  the product
- **READMEs** keep the branch's rows and add or update only the rows for this run's guides. A row
  must not link to a guide the branch lacks
- **Images** a guide references must exist on the branch. Carry across any the branch lacks from the
  card branch

## Titles

Every pull request carries the same title, in Tamanu's conventional format
(`llm/project-rules/pull-requests.md`), with no `(HOTFIX 2.xx)` suffix. The pre-release checks match
the forward cherry-picks to the release's commit by subject, so the subjects stay identical.

## Reporting

Tell the author the pull request to raise for the release they named, and each forward branch, its
base, and the pull request to raise from it.
