# Raise guide PRs against their release branch

The `draft-user-guide` and `draft-config-guide` skills raise a guide's pull request against the
release branch the guide documents, rather than against main, so the published guide matches the
version deployments run.

These are agent skills rather than Tamanu product behaviour, so the agreed behaviour lives here and
in the skills themselves rather than in `specs/`.

## Agreed behaviour

### Choosing the target branch

- **The skill asks the author which release the guides are for**, in the scope review it already
  runs, and uses their answer. It does not work the release out: the author knows which version the
  guides are published for, and inferring it from the code was more machinery than the decision
  warrants (Ed, PR review)
- It asks **once per run**, since a run's guides go to one release, and offers freshly fetched
  branches so a newly cut release appears
- **Main** is a valid answer, for a guide documenting something no release carries yet
- The skill **says so and asks again rather than proceeding** when the named release lacks a feature
  the guides document, or a guide being updated does not exist on it
- `release/2.68` is the first branch carrying `docs/user-manuals/`
- A run's guides land in one PR

### Grounding

- Once the target is known, the skill grounds the guide in **that release branch's code**, not
  main's: labels, fallbacks, flows, settings schema, permissions
- The demo site the author provides must run the target version, and the skill confirms this before
  capturing or clicking through

### Landing the PR

- The PR opens **with the release branch as its base**. The card branch is cut from main, which
  carries commits the release does not (34 at the time of writing), so the guide commits are rebased
  onto the release branch first, resolving conflicts in the module and section/platform READMEs
  against the release branch's versions
- Guides themselves often differ between main and the release (the vitals guide's caption markup
  changed on main after 2.68 was cut), so updates conflict in the guide body too. The run's version
  of each guide wins on the target, since it was verified whole against it. Forward branches instead
  keep their own later edits to the guide and take the run's changes on top; images the guide
  references are carried across where a branch lacks them
- The rebase rewrites history, so a pull request already open needs a force-push with lease and its
  base changed on GitHub. The Workhorse daemon does not push rewritten history and the skill has no
  GitHub login, so the author does both
- When the target is main, nothing changes from today

### Carrying it forward

- In the **same run**, for each release branch newer than the target and for main, the skill
  prepares a **local branch with the guide's commits cherry-picked onto it**, resolving README
  conflicts against that branch, ready for the author to push and raise
- The skill's report lists each forward branch, its base, and the PR the author raises from it

### PR titles

- The same conventional title on every branch (`chore(userGuides): …` / `chore(configGuides): …`),
  **no `(HOTFIX 2.xx)` suffix**. The pre-release checks match forward cherry-picks by subject, so
  identical subjects keep them matched

## Build steps

- [x] Put the shared targeting procedure (choosing the target, the 2.68 floor, the main fallbacks,
      rebasing, forward cherry-picks, titles) in one place both skills cite:
      `.agents/docs/guide-release-targeting.md`, pointed to from `AGENTS.md` and
      `llm/project-rules/release-branches.md`
  - [x] Target taken from the author, asked in the scope review (replaced working it out from the
        code, per Ed's review)
  - [x] Conflict rules for guides, READMEs and images, after a dry run on the vitals guide
- [x] `draft-user-guide`: ask which release in the scope review, before grounding; ground
      in the target branch's code and confirm the demo site runs that version; replace "Land it"
      with the rebase, forward branches and report
- [x] `draft-config-guide`: same changes, asking which release alongside the candidate list
- [x] Update the "Land it" report in both skills to name the pull requests to raise: the one for the
      named release, and one per forward branch
- [x] Check `pre-release-checks` and `release-cutoff-checks` still treat guide commits on a release
      branch sensibly. Pre-release checks see them as hotfixes and find them on main by subject via
      the forward branch; cut-off checks already see guide commits with no Linear card. No change
