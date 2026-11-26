# Review loop log

Rigour: Standard. Two clean rounds in a row, the second by fresh eyes. Cap: 5 rounds.

Scope: the card's branch against its base on main (`2f4765e402..HEAD`), with nothing uncommitted.

Reviewer configuration, suppressions and conventions are read from main. The branch changes none of its own agent instruction files or settings, and the repository has no MCP configuration file. The reviewers ran as the harness's read-only agent type, in this worktree, with its `CLAUDE.md`, `AGENTS.md` and `.claude/` settings (one session-start hook that acts only in remote sessions).

Bulk reports and the diff are in the card's work directory, not committed.

The run on the card ended when a device update cut the turn during round 1, so no round was recorded on the card. The rounds are counted here.

## Round 1

Reviewers: bugs and correctness, security, performance, design and architecture, BES Requirements, Integration tests, E2e tests. Accessibility does not apply, since the diff touches no UI.

Found: 0 critical, 4 suggestions, 3 nits. Not clean.

| Finding | Severity | Decision |
|---|---|---|
| Deleting the stored whitelist rows is backward incompatible by choice (security and design) | suggestion | Fixed: Tom chose to leave the rows, so the migration is dropped |
| Migration header wrong about sync history for 2.62 to 2.66 | suggestion | Gone with the migration |
| `down` rationale contradicts the `up` marker | nit | Gone with the migration |
| Migration has no test | suggestion | Skipped: no migration left to test |
| Cross-origin setting left with no caller in the repository | suggestion | Skipped: Tom decided to keep the setting. The comment now names its full path |
| Cross-origin test uses a widget-named example origin | nit | Fixed |
| Nothing asserts the former address is gone | nit | Skipped, then reopened and fixed in round 3 |

Clean in this round: bugs and correctness, performance, BES Requirements, E2e tests.

Checkpoint: lint, formatting, the settings and upgrade packages' tests and the central settings tests pass. The database package's migration tests could not connect to the local test database (an environment gap on this machine, not a failure of the change). The branch no longer changes that package.

## Round 2

Reviewers, briefed with round 1's findings and decisions: security, design and architecture, Integration tests.

Found: 0 critical, 1 suggestion, 1 nit. Clean.

| Finding | Severity | Decision |
|---|---|---|
| Nothing specifies or tests how a stored setting with no schema entry is treated | suggestion | Recorded as needing a card: a settings-wide matter main already relies on |
| The JSON editor still shows stored whitelist rows with nothing saying they are unread | nit | Skipped: asks only for wording in the pull request description and release notes, passed to Tom |

Clean in this round: security, Integration tests. No code changed, so no checkpoint was owed.

## Round 3 (cold)

Fresh reviewers given neither the earlier findings nor the decisions: bugs and correctness, security, design and architecture, BES Requirements, Integration tests. Performance and E2e tests were left out: the branch no longer holds a query, a database change or a UI change for them to read.

Found after triage: 0 critical, 1 suggestion, 1 nit. Clean.

| Finding | Severity | Decision |
|---|---|---|
| Nothing asserts the former address is refused (security, and Integration tests as a nit) | suggestion | Fixed: the round 1 skip is reversed, since release branches still carry the route and are merged forward |
| The reworded cross-origin comment implies every public route becomes usable cross-origin | nit | Fixed |

Dropped in triage, neither filed nor counted:

- Cross-origin setting has no caller (design): the same concern in the same place as round 1's skipped finding.
- Leaving the rows departs from earlier removals and the reason is not recorded (design): merged into round 2's finding recorded as needing a card.

Checkpoint: lint, formatting, the settings package's tests and the central public route and settings tests pass.

## Where it stands

Done by the stop rule: rounds 2 and 3 are clean in a row, the second cold; every reviewer that applies has come back clean at least once by the rigour's measure; the last checkpoint is green. The design reviewer never came back with nothing: its rounds 2 and 3 are clean because what survived triage was one suggestion or fewer. The two fixes made in round 3 (a test and a comment) were checked by the checkpoint and by reading, not by a further review round.

Open for a person: the finding recorded as needing a card, the wording for the pull request description, and whether to revisit keeping the cross-origin setting.
