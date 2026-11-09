# Test cases: raise guide PRs against their release branch

Run each skill on a throwaway card and check where it lands the guide. Each scenario applies to both
`draft-user-guide` and `draft-config-guide` unless it names one.

## Choosing the target

- [ ] A guide whose newest documented feature first shipped in the newest release targets that release branch
- [ ] A guide whose newest documented feature first shipped before `release/2.68` targets `release/2.68`
- [ ] Once 2.69 is cut, a guide whose newest feature first shipped in 2.68 targets `release/2.68`, not 2.69
- [ ] A guide documenting something on main but in no release branch targets main
- [ ] An update to an existing guide is targeted by the newest feature in the whole guide, even when the change only touches older content
- [ ] An update to a guide that exists on main but not on the target release branch targets main
- [ ] Config guides: the newest feature across the module's three guides decides the target

## Grounding

- [ ] With a release target, labels and flows are checked against that release branch's code, so a label renamed on main since the cut appears as it is on the release
- [ ] The skill confirms the demo site runs the target version before clicking through or capturing

## Landing

- [ ] With a release target, the card's commits are rebased onto the release branch and the branch holds only the guide's changes against it
- [ ] README conflicts during the rebase are resolved against the release branch's READMEs, and every link and anchor resolves there
- [ ] Updating a guide that differs between main and the release (such as the vitals guide) puts the run's whole version on the release, and any image it references that the release lacks is carried across
- [ ] The report tells the author to force-push with lease and change the PR's base to the release branch
- [ ] With a main target, the branch is left on main and the report says no retargeting is needed
- [ ] The PR title has no `(HOTFIX 2.xx)` suffix

## Carrying forward

- [ ] For a target older than the newest release, a local branch is prepared for each newer release and main, each carrying the guide's commits cherry-picked with the same subject
- [ ] README conflicts on forward branches are resolved against that branch, and its links resolve
- [ ] The forward branch to main carries only the run's own changes to the guide, and keeps any edit main made to it after the card branch was cut
- [ ] With the newest release as the target, a forward branch is prepared for main only
- [ ] The report lists each forward branch with its base
- [ ] `pre-release-checks` on the newer release finds the guide commit included by subject
