# Raise guide PRs against their release branch

The `draft-user-guide` and `draft-config-guide` skills raise a guide's pull request against the
release branch the guide documents, rather than against main, so the published guide matches the
version deployments run.

These are agent skills rather than Tamanu product behaviour, so the agreed behaviour lives here and
in the skills themselves rather than in `specs/`.

## Agreed behaviour

### Choosing the target branch

- The target is the release branch in which the **newest feature the guide documents first
  shipped**: the earliest `release/2.xx` branch containing that feature's code. The newest feature
  across all the guide's documented features decides
- On an update, the **whole guide** decides, not just the content the change touches, since a guide
  is published for one version
- **Floor at `release/2.68`**, the first branch carrying `docs/user-manuals/`. A computed target
  older than that becomes `release/2.68`
- **Main** is the target when either:
  - the guide documents something on main that is in no release branch yet, or
  - the guide being updated exists on main but not on the target release branch (such as guides
    added after that release was cut). It is treated like unreleased content
- A run's guides land in one PR, and the newest feature across every guide the run writes or
  updates decides. For config guides, that is whichever of a module's three guides the run touches

### Grounding

- Once the target is known, the skill grounds the guide in **that release branch's code**, not
  main's: labels, fallbacks, flows, settings schema, permissions
- The demo site the author provides must run the target version, and the skill confirms this before
  capturing or clicking through

### Landing the PR

- Workhorse cuts the card branch from main and opens the card's PR against main. When the target is
  a release branch, the skill **rebases the card's commits onto the target release branch**
  (onto `origin/release/2.xx`, from `origin/main`), resolving any conflicts in the module and
  section/platform READMEs against the release branch's versions
- Guides themselves often differ between main and the release (the vitals guide's caption markup
  changed on main after 2.68 was cut), so updates conflict in the guide body too. The run's version
  of each guide wins, since it was verified whole against the target; images it references are
  carried across if the branch lacks them
- The Workhorse daemon does not push rewritten history and the skill has no GitHub login, so the
  skill tells the author to **force-push the branch** (`git push --force-with-lease`) and **change
  the PR's base** to the release branch on GitHub
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
  - [x] Target found by walking release branches from 2.68 up for the first carrying every feature's
        code anchor (`git grep`), which also catches features hotfixed in under a different commit
  - [x] Conflict rules for guides, READMEs and images, after a dry run on the vitals guide
- [x] `draft-user-guide`: work out the target in the scope review, before grounding; ground
      in the target branch's code and confirm the demo site runs that version; replace "Land it"
      with the rebase, forward branches and report
- [x] `draft-config-guide`: same changes. Version flags already come from release branch history, so
      the target falls out of the same lookup
- [x] Update the "Land it" report in both skills to name the target branch, why it was chosen, the
      force-push and base change, and each forward branch
- [x] Check `pre-release-checks` and `release-cutoff-checks` still treat guide commits on a release
      branch sensibly. Pre-release checks see them as hotfixes and find them on main by subject via
      the forward branch; cut-off checks already see guide commits with no Linear card. No change
